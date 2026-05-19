from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from .models import Product, Category, Cart, CartItem, Order, OrderItem, OfferBanner
from .serializers import ProductSerializer, CategorySerializer, CartSerializer, CartItemSerializer, RegisterSerializer, UserSerializer, OfferBannerSerializer
from django.utils import timezone
from django.db import transaction
from django.db.models import Q

@api_view(['GET'])
def get_products(request):
    category_slug = request.GET.get('category')
    search_query = request.GET.get('search')
    limit = request.GET.get('limit')  # NEW: optional limit param

    # select_related avoids N+1 on category FK
    products = Product.objects.select_related('category').order_by('-created_at')

    if category_slug:
        products = products.filter(category__slug__iexact=category_slug)

    if search_query:
        products = products.filter(
            Q(name__icontains=search_query) |
            Q(description__icontains=search_query) |
            Q(category__name__icontains=search_query)
        )

    if limit:
        try:
            products = products[:int(limit)]
        except (ValueError, TypeError):
            pass

    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_product(request, pk):
    try:
        product = Product.objects.select_related('category').get(id=pk)
        serializer = ProductSerializer(product, context={'request': request})
        return Response(serializer.data)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=404)

@api_view(['GET'])
def get_categories(request):
    categories = Category.objects.all()
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_cart(request):
    cart, created = Cart.objects.get_or_create(user=request.user)
    # select_related + prefetch_related avoids N+1 on items -> product
    cart_with_items = Cart.objects.prefetch_related('items__product').get(id=cart.id)
    serializer = CartSerializer(cart_with_items)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_to_cart(request):
    product_id = request.data.get('product_id')
    product = Product.objects.get(id=product_id)
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
        item = CartItem.objects.get(cart=cart, id=item_id)
        quantity = int(quantity)

        if quantity < 1:
            item.delete()
            return Response({"message": "Item removed"})

        item.quantity = quantity
        item.save()
        return Response(CartItemSerializer(item).data)

    except CartItem.DoesNotExist:
        return Response({"error": "Item not found"}, status=404)

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

    phone = data.get('phone')
    if not phone or not phone.isdigit():
        return Response({"error": "Invalid phone number"}, status=400)

    cart = Cart.objects.filter(user=request.user).first()
    if not cart:
        return Response({"error": "Cart not found"}, status=404)

    cart_items = CartItem.objects.filter(cart=cart).select_related('product')
    if not cart_items.exists():
        return Response({"error": "Cart is empty"}, status=400)

    with transaction.atomic():
        total = sum(item.product.price * item.quantity for item in cart_items)

        order = Order.objects.create(
            user=request.user,
            total_amount=total
        )

        for item in cart_items:
            OrderItem.objects.create(
                order=order,
                product=item.product,
                quantity=item.quantity,
                price=item.product.price
            )

        cart_items.delete()

    return Response({
        "message": "Order placed successfully",
        "order_id": order.id
    }, status=201)

@api_view(['GET'])
def get_weekly_top_selling(request):
    """Returns products marked as Weekly Top Selling by admin."""
    products = Product.objects.filter(is_weekly_top=True).select_related('category').order_by('-created_at')
    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def get_new_arrivals(request):
    """Returns all products ordered by newest first."""
    products = Product.objects.select_related('category').order_by('-created_at')
    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response({"message": "User created successfully!", "user": UserSerializer(user).data}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def get_active_offer_banner(request):
    """Returns the single most relevant active banner to show right now."""
    now = timezone.now()
    banner = OfferBanner.objects.filter(
        is_active=True,
        show_from__lte=now,
        event_end__gte=now
    ).first()

    if not banner:
        return Response(None)

    serializer = OfferBannerSerializer(banner)
    return Response(serializer.data)