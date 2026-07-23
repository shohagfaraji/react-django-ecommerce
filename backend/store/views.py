from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from .models import Product, Category, Cart, CartItem, Order, OrderItem, HeroBanner, UserProfile
from .serializers import ProductSerializer, CategorySerializer, CategorySummarySerializer, CartSerializer, CartItemSerializer, RegisterSerializer, UserSerializer, HeroBannerSerializer, UserProfileSerializer, OrderSerializer
from django.utils import timezone
from django.db import transaction
from django.db.models import Prefetch, Q
from django.core.cache import cache
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.conf import settings
from django.core.files.storage import FileSystemStorage
from decimal import Decimal, ROUND_HALF_UP
import cloudinary.uploader
import os
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from .cache_utils import store_cache_key


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
    return Response({
        'success': True,
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    })


def get_category_tree_ids(category):
    ids = [category.id]
    pending = [category.id]

    while pending:
        child_ids = list(
            Category.objects.filter(parent_id__in=pending, is_active=True)
            .values_list('id', flat=True)
        )
        pending = [child_id for child_id in child_ids if child_id not in ids]
        ids.extend(pending)

    return ids

@api_view(['GET'])
def get_products(request):
    category_slug = request.GET.get('category')
    section = request.GET.get('section')
    search_query = request.GET.get('search')
    limit = request.GET.get('limit')  # NEW: optional limit param

    # select_related avoids N+1 on category FK
    products = Product.objects.select_related('category').order_by('-created_at')

    if category_slug:
        category = Category.objects.filter(slug__iexact=category_slug).first()
        if category:
            products = products.filter(category_id__in=get_category_tree_ids(category))
        else:
            products = products.none()

    if section:
        products = products.filter(category__section__iexact=section)

    if search_query:
        products = products.filter(
            Q(name__icontains=search_query) |
            Q(description__icontains=search_query) |
            Q(category__name__icontains=search_query) |
            Q(category__parent__name__icontains=search_query)
        )

    if limit:
        try:
            products = products[:int(limit)]
        except (ValueError, TypeError):
            pass

    cache_key = f"products:{request.GET.urlencode()}"
    data = cached_api_data(
        cache_key,
        lambda: ProductSerializer(products, many=True, context={'request': request}).data,
        timeout=180,
    )
    return Response(data)

@api_view(['GET'])
def get_product(request, pk):
    try:
        product = Product.objects.select_related('category', 'category__parent').get(id=pk)
        serializer = ProductSerializer(product, context={'request': request})
        return Response(serializer.data)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=404)

@api_view(['GET'])
def get_categories(request):
    data = cached_api_data(
        "categories:all",
        lambda: CategorySerializer(
            Category.objects.filter(parent__isnull=True, is_active=True).prefetch_related('children').order_by('sort_order', 'name'),
            many=True,
        ).data,
        timeout=600,
    )
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_cart(request):
    cart, created = Cart.objects.get_or_create(user=request.user)
    # select_related + prefetch_related avoids N+1 on items -> product
    cart_with_items = Cart.objects.prefetch_related('items__product').get(id=cart.id)
    serializer = CartSerializer(cart_with_items, context={'request': request})
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_to_cart(request):
    product_id = request.data.get('product_id')

    if not product_id:
        return Response({'error': 'product_id is required'}, status=400)

    try:
        product = Product.objects.get(id=product_id)
    except (Product.DoesNotExist, ValueError, TypeError):
        return Response({'error': 'Product not found'}, status=404)

    cart, created = Cart.objects.get_or_create(user=request.user)
    item, created = CartItem.objects.get_or_create(cart=cart, product=product)

    if not created:
        item.quantity += 1
        item.save()

    # Return only the count — frontend updates optimistically, no full refetch needed
    total_count = CartItem.objects.filter(cart=cart).values_list('quantity', flat=True)
    count = sum(total_count)
    return Response({'message': 'Product added to cart', 'cart_count': count})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_cart_quantity(request):
    item_id = request.data.get('item_id')
    quantity = request.data.get('quantity')

    cart = Cart.objects.filter(user=request.user).first()
    if not cart:
        return Response({"error": "Cart not found"}, status=404)

    try:
        quantity = int(quantity)
    except (ValueError, TypeError):
        return Response({"error": "quantity must be a valid number"}, status=400)

    try:
        item = CartItem.objects.get(cart=cart, id=item_id)
    except (CartItem.DoesNotExist, ValueError, TypeError):
        return Response({"error": "Item not found"}, status=404)

    if quantity < 1:
        item.delete()
        return Response({"message": "Item removed"})

    item.quantity = quantity
    item.save()
    return Response(CartItemSerializer(item, context={'request': request}).data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def remove_from_cart(request):
    item_id = request.data.get('item_id')
    cart = Cart.objects.filter(user=request.user).first()

    if cart:
        CartItem.objects.filter(cart=cart, id=item_id).delete()

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

    cart = Cart.objects.filter(user=request.user).first()
    if not cart:
        return Response({"error": "Cart not found"}, status=404)

    cart_items = CartItem.objects.filter(cart=cart).select_related('product')
    if not cart_items.exists():
        return Response({"error": "Cart is empty"}, status=400)

    with transaction.atomic():
        priced_items = []
        total = Decimal('0.00')
        for item in cart_items:
            unit_price = item.product.price
            if item.product.discount_percentage > 0:
                unit_price = (
                    unit_price
                    * (Decimal('1') - Decimal(item.product.discount_percentage) / Decimal('100'))
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

        for item, unit_price in priced_items:
            OrderItem.objects.create(
                order=order,
                product=item.product,
                quantity=item.quantity,
                price=unit_price,
            )

        cart_items.delete()

    return Response({
        "message": "Order placed successfully",
        "order_id": order.id
    }, status=201)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    profile, _ = UserProfile.objects.get_or_create(user=request.user)

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
    orders = (
        Order.objects.filter(user=request.user)
        .prefetch_related('items__product')
        .order_by('-created_at')
    )
    return Response(
        OrderSerializer(orders, many=True, context={'request': request}).data
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_order_detail(request, pk):
    order = (
        Order.objects.filter(user=request.user, pk=pk)
        .prefetch_related('items__product')
        .first()
    )
    if not order:
        return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)
    return Response(OrderSerializer(order, context={'request': request}).data)


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
        # The account deletion itself must not be reversed by a remote cleanup failure.
        pass

@api_view(['GET'])
def get_weekly_top_selling(request):
    """Returns products marked as Weekly Top Selling by admin."""
    products = Product.objects.filter(is_weekly_top=True).select_related('category').order_by('-created_at')
    data = cached_api_data(
        "products:weekly-top-selling",
        lambda: ProductSerializer(products, many=True, context={'request': request}).data,
        timeout=300,
    )
    return Response(data)


@api_view(['GET'])
def get_new_arrivals(request):
    """Returns all products ordered by newest first."""
    products = Product.objects.select_related('category').order_by('-created_at')
    data = cached_api_data(
        "products:new-arrivals",
        lambda: ProductSerializer(products, many=True, context={'request': request}).data,
        timeout=180,
    )
    return Response(data)

@api_view(['GET'])
def get_sale_products(request):
    """Returns products with a product-level discount."""
    products = Product.objects.select_related('category').filter(
        discount_percentage__gt=0,
    ).order_by('-discount_percentage', '-created_at')
    data = cached_api_data(
        "products:sale",
        lambda: ProductSerializer(products, many=True, context={'request': request}).data,
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

        deal_products = Product.objects.select_related('category', 'category__parent').filter(
            discount_percentage__gt=0,
        ).order_by('-discount_percentage', '-created_at')[:10]

        hot_products = Product.objects.select_related('category', 'category__parent').filter(
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
            products = Product.objects.select_related('category', 'category__parent').filter(
                Q(category=category) | Q(category_id__in=child_ids)
            ).filter(is_featured=True).order_by('-created_at')[:6]

            if not products:
                products = Product.objects.select_related('category', 'category__parent').filter(
                    Q(category=category) | Q(category_id__in=child_ids)
                ).order_by('-created_at')[:6]

            category_sections.append({
                'category': CategorySummarySerializer(category, context={'request': request}).data,
                'products': ProductSerializer(products, many=True, context={'request': request}).data,
            })

        return {
            'hero_banners': HeroBannerSerializer(hero_banners, many=True, context={'request': request}).data,
            'offer_products': ProductSerializer(deal_products, many=True, context={'request': request}).data,
            'hot_products': ProductSerializer(hot_products, many=True, context={'request': request}).data,
            'featured_products': [],
            'category_sections': category_sections,
        }

    data = cached_api_data("homepage:v1", build_homepage_data, timeout=120)
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
