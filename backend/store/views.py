from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from .models import Product, Category, Cart, CartItem, Order, OrderItem, HeroBanner, UserProfile, Review, ReviewImage
from .serializers import (
    CartItemSerializer,
    CartSerializer,
    CategorySerializer,
    CategorySummarySerializer,
    HeroBannerSerializer,
    OrderListSerializer,
    OrderSerializer,
    ProductListSerializer,
    ProductSerializer,
    RegisterSerializer,
    ReviewSerializer,
    UserProfileSerializer,
    UserSerializer,
)
from django.utils import timezone
from django.db import transaction
from django.db.models import (
    IntegerField,
    Prefetch,
    Q,
    Sum,
    Value,
    prefetch_related_objects,
)
from django.db.models.functions import Coalesce
from django.core.cache import cache
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.conf import settings
from django.core.files.storage import FileSystemStorage
from decimal import Decimal, ROUND_HALF_UP
from uuid import uuid4
import cloudinary.uploader
import os
from urllib.parse import urlencode
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from .cache_utils import bump_store_cache_version, store_cache_key
from .inventory import (
    InventoryError,
    reserve_cart_inventory,
    validate_product_quantity,
)


def cached_api_data(key, factory, timeout=300):
    versioned_key = store_cache_key(key)
    data = cache.get(versioned_key)
    if data is None:
        data = factory()
        cache.set(versioned_key, data, timeout)
    return data


@api_view(['POST'])
@permission_classes([AllowAny])
def login_token(request):
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')

    if not username or not password:
        return Response({
            'success': False,
            'detail': 'Username and password are required.',
        })

    user = authenticate(request, username=username, password=password)
    if not user:
        return Response({
            'success': False,
            'detail': 'Invalid username or password.',
        })

    refresh = RefreshToken.for_user(user)
    profile, _ = UserProfile.objects.get_or_create(user=user)
    profile.order_count = Order.objects.filter(user=user).count()
    return Response({
        'success': True,
        'refresh': str(refresh),
        'access': str(refresh.access_token),
        'profile': UserProfileSerializer(
            profile,
            context={'request': request},
        ).data,
    })


PRODUCT_LIST_FIELDS = (
    'id',
    'category_id',
    'name',
    'price',
    'image',
    'created_at',
    'is_weekly_top',
    'is_hot',
    'is_featured',
    'discount_percentage',
    'average_rating',
    'review_count',
    'track_inventory',
    'stock_quantity',
    'low_stock_threshold',
    'category__id',
    'category__name',
    'category__slug',
    'category__section',
    'category__parent_id',
    'category__image',
)
MAX_CATALOG_PAGE_SIZE = 60


def product_list_queryset():
    return Product.objects.select_related('category').only(
        *PRODUCT_LIST_FIELDS,
    )


def get_category_tree_ids(category_slug):
    def build_tree_ids():
        categories = list(
            Category.objects.filter(is_active=True).values_list(
                'id',
                'parent_id',
                'slug',
            )
        )
        root_id = next(
            (
                category_id
                for category_id, _, slug in categories
                if slug.lower() == category_slug
            ),
            None,
        )
        if root_id is None:
            return []

        children_by_parent = {}
        for category_id, parent_id, _ in categories:
            children_by_parent.setdefault(parent_id, []).append(category_id)

        category_ids = []
        pending = [root_id]
        while pending:
            category_id = pending.pop()
            category_ids.append(category_id)
            pending.extend(children_by_parent.get(category_id, []))
        return category_ids

    return cached_api_data(
        f'category-tree:{category_slug}',
        build_tree_ids,
        timeout=600,
    )


def get_catalog_window(request):
    raw_limit = request.GET.get('limit')
    if raw_limit in (None, ''):
        return None, 0

    try:
        limit = int(raw_limit)
        offset = int(request.GET.get('offset', 0))
    except (TypeError, ValueError):
        return None, 0

    limit = min(max(limit, 1), MAX_CATALOG_PAGE_SIZE)
    offset = max(offset, 0)
    return limit, offset


def apply_catalog_window(products, limit, offset):
    if limit is None:
        return products
    return products[offset:offset + limit]


def catalog_cache_key(prefix, limit, offset):
    if limit is None:
        return prefix
    return f'{prefix}:limit={limit}:offset={offset}'

@api_view(['GET'])
def get_products(request):
    category_slug = request.GET.get('category', '').strip().lower()
    section = request.GET.get('section', '').strip().lower()
    search_query = ' '.join(request.GET.get('search', '').split()).lower()
    limit, offset = get_catalog_window(request)
    cache_params = [
        ('category', category_slug),
        ('section', section),
        ('search', search_query),
        ('limit', '' if limit is None else limit),
        ('offset', offset),
    ]

    def build_product_data():
        products = product_list_queryset().order_by('-created_at', '-id')

        if category_slug:
            category_ids = get_category_tree_ids(category_slug)
            products = (
                products.filter(category_id__in=category_ids)
                if category_ids
                else products.none()
            )

        if section:
            products = products.filter(category__section=section)

        if search_query:
            products = products.filter(
                Q(name__icontains=search_query) |
                Q(description__icontains=search_query) |
                Q(category__name__icontains=search_query) |
                Q(category__parent__name__icontains=search_query)
            )

        products = apply_catalog_window(products, limit, offset)
        return ProductListSerializer(
            products,
            many=True,
            context={'request': request},
        ).data

    data = cached_api_data(
        f'products:{urlencode(cache_params)}',
        build_product_data,
        timeout=180,
    )
    return Response(data)

@api_view(['GET'])
def get_product(request, pk):
    def build_product_data():
        product = Product.objects.select_related(
            'category',
            'category__parent',
        ).get(id=pk)
        return ProductSerializer(
            product,
            context={'request': request},
        ).data

    try:
        data = cached_api_data(
            f'product:{pk}',
            build_product_data,
            timeout=180,
        )
        return Response(data)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=404)

@api_view(['GET'])
def get_categories(request):
    def build_category_data():
        categories = list(
            Category.objects.filter(is_active=True)
            .order_by('sort_order', 'name')
        )
        children_by_parent = {}
        roots = []
        for category in categories:
            if category.parent_id is None:
                roots.append(category)
            else:
                children_by_parent.setdefault(category.parent_id, []).append(
                    category
                )

        return CategorySerializer(
            roots,
            many=True,
            context={
                'request': request,
                'children_by_parent': children_by_parent,
            },
        ).data

    data = cached_api_data(
        "categories:all",
        build_category_data,
        timeout=600,
    )
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_cart(request):
    cart, created = Cart.objects.get_or_create(user=request.user)
    if created:
        cart._prefetched_objects_cache = {'items': []}
    else:
        prefetch_related_objects(
            [cart],
            Prefetch(
                'items',
                queryset=CartItem.objects.select_related('product'),
            ),
        )
    serializer = CartSerializer(cart, context={'request': request})
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_to_cart(request):
    product_id = request.data.get('product_id')

    if not product_id:
        return Response({'error': 'product_id is required'}, status=400)

    try:
        with transaction.atomic():
            product = Product.objects.get(id=product_id)
            cart, _ = Cart.objects.get_or_create(user=request.user)
            item = CartItem.objects.select_for_update().filter(
                cart=cart,
                product=product,
            ).first()
            next_quantity = item.quantity + 1 if item else 1
            validate_product_quantity(product, next_quantity)
            if item:
                item.quantity = next_quantity
                item.save(update_fields=['quantity'])
            else:
                item = CartItem.objects.create(
                    cart=cart,
                    product=product,
                    quantity=1,
                )
    except (Product.DoesNotExist, ValueError, TypeError):
        return Response({'error': 'Product not found'}, status=404)
    except InventoryError as exc:
        return Response({'error': str(exc)}, status=400)

    count = CartItem.objects.filter(cart=cart).aggregate(
        total=Coalesce(
            Sum('quantity'),
            Value(0),
            output_field=IntegerField(),
        ),
    )['total']
    return Response({
        'message': 'Product added to cart',
        'cart_count': count,
        'item': CartItemSerializer(
            item,
            context={'request': request},
        ).data,
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_cart_quantity(request):
    item_id = request.data.get('item_id')
    quantity = request.data.get('quantity')

    try:
        quantity = int(quantity)
    except (ValueError, TypeError):
        return Response({"error": "quantity must be a valid number"}, status=400)

    try:
        item = CartItem.objects.select_related('product').get(
            cart__user=request.user,
            id=item_id,
        )
    except (CartItem.DoesNotExist, ValueError, TypeError):
        return Response({"error": "Item not found"}, status=404)

    if quantity < 1:
        item.delete()
        return Response({"message": "Item removed"})

    try:
        validate_product_quantity(item.product, quantity)
    except InventoryError as exc:
        return Response({'error': str(exc)}, status=400)

    item.quantity = quantity
    item.save(update_fields=['quantity'])
    return Response(CartItemSerializer(item, context={'request': request}).data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def remove_from_cart(request):
    item_id = request.data.get('item_id')
    CartItem.objects.filter(
        cart__user=request.user,
        id=item_id,
    ).delete()

    return Response({"message": "Item removed"})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_order(request):
    data = request.data

    recipient_name = str(data.get('name', '')).strip()
    address = str(data.get('address', '')).strip()
    phone = str(data.get('phone', '')).strip()
    payment_method = data.get('payment_method', 'COD')

    if not recipient_name:
        return Response({"error": "Name is required"}, status=400)
    if not address:
        return Response({"error": "Delivery address is required"}, status=400)
    if not phone or not phone.replace('+', '', 1).isdigit():
        return Response({"error": "Invalid phone number"}, status=400)
    if payment_method not in {'COD', 'CreditCard'}:
        return Response({"error": "Invalid payment method"}, status=400)

    try:
        with transaction.atomic():
            cart = Cart.objects.select_for_update().filter(
                user=request.user,
            ).first()
            if not cart:
                return Response({"error": "Cart not found"}, status=404)

            cart_items = list(CartItem.objects.filter(cart=cart))
            if not cart_items:
                return Response({"error": "Cart is empty"}, status=400)

            stock_deductions = reserve_cart_inventory(cart_items)
            priced_items = []
            total = Decimal('0.00')
            for item in cart_items:
                unit_price = item.product.price
                if item.product.discount_percentage > 0:
                    unit_price = (
                        unit_price
                        * (
                            Decimal('1')
                            - Decimal(item.product.discount_percentage)
                            / Decimal('100')
                        )
                    ).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                total += unit_price * item.quantity
                priced_items.append((item, unit_price))

            order = Order.objects.create(
                user=request.user,
                total_amount=total,
                recipient_name=recipient_name,
                phone=phone,
                delivery_address=address,
                payment_method=payment_method,
            )

            OrderItem.objects.bulk_create([
                OrderItem(
                    order=order,
                    product=item.product,
                    quantity=item.quantity,
                    price=unit_price,
                    stock_deducted=stock_deductions[item.pk],
                )
                for item, unit_price in priced_items
            ])

            CartItem.objects.filter(
                pk__in=[item.pk for item in cart_items],
            ).delete()
            if any(stock_deductions.values()):
                transaction.on_commit(bump_store_cache_version)
    except InventoryError as exc:
        return Response({'error': str(exc)}, status=400)

    return Response({
        "message": "Order placed successfully",
        "order_id": order.id,
        "item_count": sum(item.quantity for item in cart_items),
        "total_amount": str(total),
    }, status=201)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    profile.order_count = Order.objects.filter(user=request.user).count()

    if request.method == 'GET':
        return Response(
            UserProfileSerializer(profile, context={'request': request}).data
        )

    serializer = UserProfileSerializer(
        profile,
        data=request.data,
        partial=True,
        context={'request': request},
    )
    if serializer.is_valid():
        with transaction.atomic():
            serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    current_password = request.data.get('current_password', '')
    new_password = request.data.get('new_password', '')
    confirm_password = request.data.get('confirm_password', '')

    if not request.user.check_password(current_password):
        return Response(
            {'current_password': ['Current password is incorrect.']},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if new_password != confirm_password:
        return Response(
            {'confirm_password': ['New passwords do not match.']},
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        validate_password(new_password, user=request.user)
    except ValidationError as exc:
        return Response(
            {'new_password': list(exc.messages)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    request.user.set_password(new_password)
    request.user.save(update_fields=['password'])
    return Response({'message': 'Password changed successfully.'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_current_password(request):
    password = request.data.get('current_password', '')
    return Response({
        'matches': bool(password) and request.user.check_password(password),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_orders(request):
    orders = list(
        Order.objects.filter(user=request.user)
        .annotate(
            item_count_value=Coalesce(
                Sum('items__quantity'),
                Value(0),
                output_field=IntegerField(),
            ),
        )
        .order_by('-created_at', '-id')
    )
    order_count = len(orders)
    for index, order in enumerate(orders):
        order.customer_order_number = order_count - index
    return Response(
        OrderListSerializer(orders, many=True, context={'request': request}).data
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_order_detail(request, pk):
    order_items = OrderItem.objects.select_related(
        'product',
        'review',
        'review__user',
    ).prefetch_related('review__images')
    order = (
        Order.objects.filter(user=request.user, pk=pk)
        .prefetch_related(Prefetch('items', queryset=order_items))
        .first()
    )
    if not order:
        return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)
    order.customer_order_number = Order.objects.filter(
        user=request.user,
    ).filter(
        Q(created_at__lt=order.created_at)
        | Q(created_at=order.created_at, id__lte=order.id)
    ).count()
    return Response(OrderSerializer(order, context={'request': request}).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def product_reviews(request, pk):
    def build_review_data():
        reviews = list(
            Review.objects.filter(product_id=pk)
            .select_related('user')
            .prefetch_related('images')
        )
        if not reviews and not Product.objects.filter(pk=pk).exists():
            raise Product.DoesNotExist
        return ReviewSerializer(
            reviews,
            many=True,
            context={'request': request},
        ).data

    try:
        data = cached_api_data(
            f'product-reviews:{pk}',
            build_review_data,
            timeout=120,
        )
    except Product.DoesNotExist:
        return Response(
            {'detail': 'Product not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_review(request):
    try:
        order_item_id = int(request.data.get('order_item'))
        rating = int(request.data.get('rating'))
    except (TypeError, ValueError):
        return Response({'detail': 'A valid order item and rating are required.'}, status=status.HTTP_400_BAD_REQUEST)

    if rating not in range(1, 6):
        return Response({'rating': ['Rating must be between 1 and 5.']}, status=status.HTTP_400_BAD_REQUEST)

    comment = str(request.data.get('comment', '')).strip()
    if len(comment) > 2000:
        return Response({'comment': ['Comment must be 2000 characters or fewer.']}, status=status.HTTP_400_BAD_REQUEST)

    order_item = OrderItem.objects.select_related('order', 'product', 'review').filter(
        pk=order_item_id,
        order__user=request.user,
    ).first()
    if not order_item:
        return Response({'detail': 'This product was not purchased by you.'}, status=status.HTTP_403_FORBIDDEN)
    if order_item.order.status != Order.STATUS_DELIVERED:
        return Response({'detail': 'You can review this product after it is delivered.'}, status=status.HTTP_403_FORBIDDEN)
    try:
        order_item.review
    except Review.DoesNotExist:
        pass
    else:
        return Response({'detail': 'This delivered item has already been reviewed.'}, status=status.HTTP_400_BAD_REQUEST)

    images = request.FILES.getlist('images')
    if len(images) > 5:
        return Response({'images': ['You can attach up to 5 images.']}, status=status.HTTP_400_BAD_REQUEST)
    for image in images:
        if image.size > 5 * 1024 * 1024 or not getattr(image, 'content_type', '').startswith('image/'):
            return Response({'images': ['Each attachment must be an image no larger than 5 MB.']}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        review = Review.objects.create(
            order_item=order_item,
            product=order_item.product,
            user=request.user,
            rating=rating,
            comment=comment,
        )
        review._prefetched_objects_cache = {
            'images': _save_review_images(review, images),
        }

    return Response(
        ReviewSerializer(review, context={'request': request}).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def review_detail(request, pk):
    review = Review.objects.filter(pk=pk, user=request.user).prefetch_related('images').first()
    if not review:
        return Response({'detail': 'Review not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        image_names = [str(image.image) for image in review.images.all()]
        with transaction.atomic():
            review.delete()
            transaction.on_commit(lambda: _delete_review_images(image_names))
        return Response(status=status.HTTP_204_NO_CONTENT)

    try:
        rating = int(request.data.get('rating', review.rating))
    except (TypeError, ValueError):
        return Response({'rating': ['Rating must be a number between 1 and 5.']}, status=status.HTTP_400_BAD_REQUEST)
    if rating not in range(1, 6):
        return Response({'rating': ['Rating must be between 1 and 5.']}, status=status.HTTP_400_BAD_REQUEST)

    comment = str(request.data.get('comment', review.comment)).strip()
    if len(comment) > 2000:
        return Response({'comment': ['Comment must be 2000 characters or fewer.']}, status=status.HTTP_400_BAD_REQUEST)

    existing_images = list(review.images.all())
    images = request.FILES.getlist('images')
    if len(existing_images) + len(images) > 5:
        return Response({'images': ['A review can have up to 5 images in total.']}, status=status.HTTP_400_BAD_REQUEST)
    for image in images:
        if image.size > 5 * 1024 * 1024 or not getattr(image, 'content_type', '').startswith('image/'):
            return Response({'images': ['Each attachment must be an image no larger than 5 MB.']}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        review.rating = rating
        review.comment = comment
        review.save(update_fields=['rating', 'comment'])
        new_images = _save_review_images(review, images)
        review._prefetched_objects_cache['images'] = existing_images + new_images

    return Response(ReviewSerializer(review, context={'request': request}).data)


def _delete_review_image(image_name):
    try:
        if settings.USE_CLOUDINARY_MEDIA:
            cloudinary.uploader.destroy(image_name, resource_type='image')
        else:
            storage = FileSystemStorage(location=settings.MEDIA_ROOT)
            if storage.exists(image_name):
                storage.delete(image_name)
    except Exception:
        pass


def _delete_review_images(image_names):
    for image_name in image_names:
        _delete_review_image(image_name)


def _save_review_images(review, images):
    review_images = []
    for image in images:
        safe_name = f"{uuid4().hex}-{os.path.basename(image.name)}"
        if settings.USE_CLOUDINARY_MEDIA:
            uploaded = cloudinary.uploader.upload(
                image,
                folder=f"reviews/{review.id}",
                resource_type='image',
            )
            image_name = uploaded['public_id']
        else:
            storage = FileSystemStorage(location=settings.MEDIA_ROOT)
            image_name = storage.save(
                f"reviews/{review.id}/{safe_name}",
                image,
            )
        review_images.append(ReviewImage(review=review, image=image_name))
    return ReviewImage.objects.bulk_create(review_images)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_account(request):
    if request.data.get('confirmation') != 'DELETE':
        return Response(
            {'confirmation': ['Type DELETE to confirm account deletion.']},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if not request.user.check_password(request.data.get('password', '')):
        return Response(
            {'password': ['Password is incorrect.']},
            status=status.HTTP_400_BAD_REQUEST,
        )

    profile = UserProfile.objects.filter(user=request.user).first()
    picture_name = (
        str(profile.profile_picture)
        if profile and profile.profile_picture
        else ''
    )

    with transaction.atomic():
        request.user.delete()
        if picture_name:
            transaction.on_commit(lambda: _delete_profile_picture(picture_name))
    return Response(status=status.HTTP_204_NO_CONTENT)


def _delete_profile_picture(picture_name):
    try:
        if settings.USE_CLOUDINARY_MEDIA:
            cloudinary.uploader.destroy(picture_name, resource_type='image')
        else:
            storage = FileSystemStorage(location=settings.MEDIA_ROOT)
            if storage.exists(picture_name):
                storage.delete(picture_name)
    except Exception:
        pass

@api_view(['GET'])
def get_weekly_top_selling(request):
    limit, offset = get_catalog_window(request)
    products = product_list_queryset().filter(
        is_weekly_top=True,
    ).order_by('-created_at', '-id')
    products = apply_catalog_window(products, limit, offset)
    data = cached_api_data(
        catalog_cache_key('products:weekly-top-selling', limit, offset),
        lambda: ProductListSerializer(products, many=True, context={'request': request}).data,
        timeout=300,
    )
    return Response(data)


@api_view(['GET'])
def get_new_arrivals(request):
    limit, offset = get_catalog_window(request)
    products = product_list_queryset().order_by('-created_at', '-id')
    products = apply_catalog_window(products, limit, offset)
    data = cached_api_data(
        catalog_cache_key('products:new-arrivals', limit, offset),
        lambda: ProductListSerializer(products, many=True, context={'request': request}).data,
        timeout=180,
    )
    return Response(data)

@api_view(['GET'])
def get_sale_products(request):
    limit, offset = get_catalog_window(request)
    products = product_list_queryset().filter(
        discount_percentage__gt=0,
    ).order_by('-discount_percentage', '-created_at', '-id')
    products = apply_catalog_window(products, limit, offset)
    data = cached_api_data(
        catalog_cache_key('products:sale', limit, offset),
        lambda: ProductListSerializer(products, many=True, context={'request': request}).data,
        timeout=120,
    )
    return Response(data)

@api_view(['GET'])
def get_hero_banners(request):
    now = timezone.now()
    banners = HeroBanner.objects.select_related('category').filter(
        is_active=True,
        show_on_home=True,
    ).filter(
        Q(starts_at__isnull=True) | Q(starts_at__lte=now),
        Q(ends_at__isnull=True) | Q(ends_at__gte=now),
    ).order_by('sort_order', '-created_at')

    data = cached_api_data(
        "hero-banners:active",
        lambda: HeroBannerSerializer(banners, many=True, context={'request': request}).data,
        timeout=120,
    )
    return Response(data)

@api_view(['GET'])
def get_homepage(request):
    now = timezone.now()

    def build_homepage_data():
        hero_banners = HeroBanner.objects.select_related('category').filter(
            is_active=True,
            show_on_home=True,
        ).filter(
            Q(starts_at__isnull=True) | Q(starts_at__lte=now),
            Q(ends_at__isnull=True) | Q(ends_at__gte=now),
        ).order_by('sort_order', '-created_at')[:8]

        deal_products = product_list_queryset().filter(
            discount_percentage__gt=0,
        ).order_by('-discount_percentage', '-created_at')[:10]

        hot_products = product_list_queryset().filter(
            Q(is_hot=True) | Q(is_weekly_top=True)
        ).order_by('-is_hot', '-is_weekly_top', '-created_at')[:10]

        featured_categories = Category.objects.filter(
            parent__isnull=True,
            is_active=True,
            is_featured=True,
        ).prefetch_related(
            Prefetch(
                'children',
                queryset=Category.objects.filter(is_active=True).only('id', 'parent_id'),
            )
        ).order_by('sort_order', 'name')[:4]

        category_sections = []
        for category in featured_categories:
            child_ids = [child.id for child in category.children.all()]
            category_products = product_list_queryset().filter(
                Q(category=category) | Q(category_id__in=child_ids)
            )
            products = category_products.order_by(
                '-is_featured',
                '-created_at',
            )[:10]

            category_sections.append({
                'category': CategorySummarySerializer(category, context={'request': request}).data,
                'products': ProductListSerializer(products, many=True, context={'request': request}).data,
            })

        return {
            'hero_banners': HeroBannerSerializer(hero_banners, many=True, context={'request': request}).data,
            'offer_products': ProductListSerializer(deal_products, many=True, context={'request': request}).data,
            'hot_products': ProductListSerializer(hot_products, many=True, context={'request': request}).data,
            'featured_products': [],
            'category_sections': category_sections,
        }

    data = cached_api_data("homepage:v4", build_homepage_data, timeout=300)
    return Response(data)

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response({"message": "User created successfully!", "user": UserSerializer(user).data}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def check_username(request):
    raw_username = request.GET.get('username', '')
    username = raw_username.strip()

    if not username:
        return Response({
            "available": False,
            "message": "Enter a username.",
        }, status=status.HTTP_400_BAD_REQUEST)

    if any(char.isspace() for char in raw_username):
        return Response({
            "available": False,
            "message": "Username cannot contain spaces.",
        }, status=status.HTTP_400_BAD_REQUEST)

    matches = User.objects.filter(username__iexact=username)
    if request.user.is_authenticated:
        matches = matches.exclude(pk=request.user.pk)
    is_taken = matches.exists()
    return Response({
        "available": not is_taken,
        "message": "This username is already taken." if is_taken else "Username is available.",
    })


@api_view(['POST'])
def bootstrap_superuser(request):
    if request.data.get('setup_key') != os.getenv('SUPERUSER_SETUP_KEY'):
        return Response({'error': 'unauthorized'}, status=403)

    username = request.data.get('username')
    email = request.data.get('email', '')
    password = request.data.get('password')

    if not username or not password:
        return Response({'error': 'username and password required'}, status=400)

    if User.objects.filter(is_superuser=True).exists():
        return Response({'error': 'a superuser already exists'}, status=400)

    User.objects.create_superuser(username=username, email=email, password=password)
    return Response({'status': 'superuser created'})
