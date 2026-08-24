from datetime import timedelta
from decimal import Decimal

from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import (
    Avg,
    Count,
    DecimalField,
    F,
    IntegerField,
    Q,
    Sum,
    Value,
)
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from .admin_serializers import (
    AdminCategorySerializer,
    AdminHeroBannerSerializer,
    AdminOrderSerializer,
    AdminProductSerializer,
    AdminReviewSerializer,
    AdminReviewSummarySerializer,
    delete_dashboard_image,
)
from .cache_utils import bump_store_cache_version
from .inventory import InventoryError, change_order_status
from .models import Category, HeroBanner, Order, Product, Review


def schedule_store_cache_refresh():
    transaction.on_commit(bump_store_cache_version)


def request_limit(request, default=100, maximum=200):
    try:
        return min(max(int(request.GET.get('limit', default)), 1), maximum)
    except (TypeError, ValueError):
        return default


def order_queryset():
    return Order.objects.select_related('user').annotate(
        item_count_value=Coalesce(
            Sum('items__quantity'),
            Value(0),
            output_field=IntegerField(),
        ),
    )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_dashboard(request):
    order_groups = list(Order.objects.values('status').annotate(
        count=Count('id'),
        revenue=Coalesce(
            Sum('total_amount'),
            Value(Decimal('0.00')),
            output_field=DecimalField(max_digits=12, decimal_places=2),
        ),
    ))
    status_counts = {
        item['status']: item['count']
        for item in order_groups
    }
    terminal_statuses = {Order.STATUS_DELIVERED, Order.STATUS_CANCELLED}
    delivered_group = next(
        (
            item
            for item in order_groups
            if item['status'] == Order.STATUS_DELIVERED
        ),
        None,
    )
    order_summary = {
        'total': sum(item['count'] for item in order_groups),
        'pending': sum(
            item['count']
            for item in order_groups
            if item['status'] not in terminal_statuses
        ),
        'delivered': status_counts.get(Order.STATUS_DELIVERED, 0),
        'revenue': (
            delivered_group['revenue']
            if delivered_group
            else Decimal('0.00')
        ),
    }
    review_summary = Review.objects.aggregate(
        total=Count('id'),
        average=Avg('rating'),
    )
    recent_orders = order_queryset().order_by('-created_at', '-id')[:6]
    recent_reviews = (
        Review.objects.select_related('user', 'product')
        .order_by('-created_at', '-id')[:5]
    )
    thirty_days_ago = timezone.now() - timedelta(days=30)
    product_summary = Product.objects.aggregate(
        total=Count('id'),
        low_stock=Count(
            'id',
            filter=Q(
                track_inventory=True,
                stock_quantity__gt=0,
                stock_quantity__lte=F('low_stock_threshold'),
            ),
        ),
        out_of_stock=Count(
            'id',
            filter=Q(track_inventory=True, stock_quantity=0),
        ),
    )
    customer_summary = User.objects.aggregate(
        total=Count('id', filter=Q(is_staff=False)),
        new=Count(
            'id',
            filter=Q(is_staff=False, date_joined__gte=thirty_days_ago),
        ),
    )

    return Response({
        'staff': {
            'username': request.user.username,
            'email': request.user.email,
        },
        'metrics': {
            'products': product_summary['total'],
            'low_stock_products': product_summary['low_stock'],
            'out_of_stock_products': product_summary['out_of_stock'],
            'categories': Category.objects.count(),
            'customers': customer_summary['total'],
            'orders': order_summary['total'],
            'pending_orders': order_summary['pending'],
            'delivered_orders': order_summary['delivered'],
            'delivered_revenue': order_summary['revenue'],
            'reviews': review_summary['total'],
            'average_rating': review_summary['average'] or 0,
            'new_customers_30_days': customer_summary['new'],
        },
        'order_status_counts': status_counts,
        'recent_orders': AdminOrderSerializer(
            recent_orders,
            many=True,
            context={'request': request},
        ).data,
        'recent_reviews': AdminReviewSummarySerializer(
            recent_reviews,
            many=True,
            context={'request': request},
        ).data,
    })


@api_view(['GET', 'POST'])
@permission_classes([IsAdminUser])
def admin_products(request):
    if request.method == 'GET':
        products = Product.objects.select_related('category').order_by(
            '-created_at',
            '-id',
        )
        search = request.GET.get('search', '').strip()
        if search:
            products = products.filter(
                Q(name__icontains=search) |
                Q(category__name__icontains=search)
            )
        products = products[:request_limit(request)]
        return Response(AdminProductSerializer(
            products,
            many=True,
            context={'request': request},
        ).data)

    serializer = AdminProductSerializer(
        data=request.data,
        context={'request': request},
    )
    serializer.is_valid(raise_exception=True)
    with transaction.atomic():
        product = serializer.save()
        schedule_store_cache_refresh()
    return Response(
        AdminProductSerializer(
            product,
            context={'request': request},
        ).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAdminUser])
def admin_product_detail(request, pk):
    product = Product.objects.select_related('category').filter(pk=pk).first()
    if not product:
        return Response(
            {'detail': 'Product not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == 'DELETE':
        if product.orderitem_set.exists():
            return Response(
                {
                    'detail': (
                        'Products included in orders cannot be deleted because '
                        'order history must be preserved.'
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        image_name = str(product.image) if product.image else ''
        with transaction.atomic():
            product.delete()
            schedule_store_cache_refresh()
            if image_name:
                transaction.on_commit(
                    lambda: delete_dashboard_image(image_name)
                )
        return Response(status=status.HTTP_204_NO_CONTENT)

    with transaction.atomic():
        product = Product.objects.select_for_update().select_related(
            'category',
        ).filter(pk=pk).first()
        if not product:
            return Response(
                {'detail': 'Product not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = AdminProductSerializer(
            product,
            data=request.data,
            partial=True,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        product = serializer.save()
        schedule_store_cache_refresh()
    return Response(AdminProductSerializer(
        product,
        context={'request': request},
    ).data)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_orders(request):
    orders = order_queryset().order_by('-created_at', '-id')
    order_status = request.GET.get('status', '').strip()
    search = request.GET.get('search', '').strip()
    if order_status:
        orders = orders.filter(status=order_status)
    if search:
        filters = (
            Q(recipient_name__icontains=search) |
            Q(phone__icontains=search) |
            Q(user__username__icontains=search)
        )
        if search.isdigit():
            filters |= Q(pk=int(search))
        orders = orders.filter(filters)
    orders = orders[:request_limit(request)]
    return Response(AdminOrderSerializer(
        orders,
        many=True,
        context={'request': request},
    ).data)


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def admin_order_status(request, pk):
    next_status = request.data.get('status')
    valid_statuses = {choice[0] for choice in Order.STATUS_CHOICES}
    if next_status not in valid_statuses:
        return Response(
            {'status': ['Choose a valid order status.']},
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        order, inventory_changed = change_order_status(pk, next_status)
    except InventoryError as exc:
        return Response(
            {'status': [str(exc)]},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if not order:
        return Response(
            {'detail': 'Order not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )
    if inventory_changed:
        schedule_store_cache_refresh()
    return Response({
        'id': order.id,
        'status': order.status,
        'status_display': order.get_status_display(),
        'updated_at': order.updated_at,
    })


@api_view(['GET', 'POST'])
@permission_classes([IsAdminUser])
def admin_categories(request):
    if request.method == 'GET':
        categories = Category.objects.select_related('parent').order_by(
            'sort_order',
            'name',
        )
        return Response(AdminCategorySerializer(
            categories,
            many=True,
            context={'request': request},
        ).data)

    serializer = AdminCategorySerializer(
        data=request.data,
        context={'request': request},
    )
    serializer.is_valid(raise_exception=True)
    with transaction.atomic():
        category = serializer.save()
        schedule_store_cache_refresh()
    return Response(
        AdminCategorySerializer(
            category,
            context={'request': request},
        ).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAdminUser])
def admin_category_detail(request, pk):
    category = Category.objects.select_related('parent').filter(pk=pk).first()
    if not category:
        return Response(
            {'detail': 'Category not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == 'DELETE':
        if category.products.exists() or category.children.exists():
            return Response(
                {
                    'detail': (
                        'Move or delete this category’s products and child '
                        'categories first.'
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        if category.hero_banners.exists():
            return Response(
                {'detail': 'Remove banners linked to this category first.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        image_name = str(category.image) if category.image else ''
        with transaction.atomic():
            category.delete()
            schedule_store_cache_refresh()
            if image_name:
                transaction.on_commit(
                    lambda: delete_dashboard_image(image_name)
                )
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = AdminCategorySerializer(
        category,
        data=request.data,
        partial=True,
        context={'request': request},
    )
    serializer.is_valid(raise_exception=True)
    with transaction.atomic():
        category = serializer.save()
        schedule_store_cache_refresh()
    return Response(AdminCategorySerializer(
        category,
        context={'request': request},
    ).data)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_reviews(request):
    reviews = (
        Review.objects.select_related('user', 'product')
        .prefetch_related('images')
        .order_by('-created_at', '-id')
    )
    search = request.GET.get('search', '').strip()
    if search:
        reviews = reviews.filter(
            Q(product__name__icontains=search) |
            Q(user__username__icontains=search) |
            Q(comment__icontains=search)
        )
    reviews = reviews[:request_limit(request)]
    return Response(AdminReviewSerializer(
        reviews,
        many=True,
        context={'request': request},
    ).data)


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def admin_review_detail(request, pk):
    review = Review.objects.prefetch_related('images').filter(pk=pk).first()
    if not review:
        return Response(
            {'detail': 'Review not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )
    image_names = [str(image.image) for image in review.images.all()]
    with transaction.atomic():
        review.delete()
        for image_name in image_names:
            transaction.on_commit(
                lambda name=image_name: delete_dashboard_image(name)
            )
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET', 'POST'])
@permission_classes([IsAdminUser])
def admin_banners(request):
    if request.method == 'GET':
        banners = HeroBanner.objects.select_related('category').order_by(
            'sort_order',
            '-created_at',
        )
        return Response(AdminHeroBannerSerializer(
            banners,
            many=True,
            context={'request': request},
        ).data)

    serializer = AdminHeroBannerSerializer(
        data=request.data,
        context={'request': request},
    )
    serializer.is_valid(raise_exception=True)
    with transaction.atomic():
        banner = serializer.save()
        schedule_store_cache_refresh()
    return Response(
        AdminHeroBannerSerializer(
            banner,
            context={'request': request},
        ).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAdminUser])
def admin_banner_detail(request, pk):
    banner = HeroBanner.objects.select_related('category').filter(pk=pk).first()
    if not banner:
        return Response(
            {'detail': 'Banner not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == 'DELETE':
        image_name = str(banner.image) if banner.image else ''
        with transaction.atomic():
            banner.delete()
            schedule_store_cache_refresh()
            if image_name:
                transaction.on_commit(
                    lambda: delete_dashboard_image(image_name)
                )
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = AdminHeroBannerSerializer(
        banner,
        data=request.data,
        partial=True,
        context={'request': request},
    )
    serializer.is_valid(raise_exception=True)
    with transaction.atomic():
        banner = serializer.save()
        schedule_store_cache_refresh()
    return Response(AdminHeroBannerSerializer(
        banner,
        context={'request': request},
    ).data)
