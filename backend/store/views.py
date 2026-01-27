from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import User
from rest_framework import status
from .models import Product, Category, Cart, CartItem, Order, OrderItem
from .serializers import ProductSerializer, CategorySerializer, CartSerializer, CartItemSerializer, RegisterSerializer, UserSerializer
from django.db import transaction

@api_view(['GET'])
def get_products(request):
    products = Product.objects.all()
    serializer = ProductSerializer(products, many = True)
    return Response(serializer.data)

@api_view(['GET'])
def get_product(request, pk):
    try:
        product = Product.objects.get(id = pk)
        serializer = ProductSerializer(product, context = {'request' : request})
        return Response(serializer.data)
    except Product.DoesNotExist:
        return Response({'error' : 'Product not found'}, status = 404)

@api_view(['GET'])
def get_categories(request):
    categories = Category.objects.all()
    serializer = CategorySerializer(categories, many = True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_cart(request):
    cart, created = Cart.objects.get_or_create(user=request.user)
    serializer = CartSerializer(cart)
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
    return Response({'message': 'Product added to cart',"cart":CartSerializer(cart).data})

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

    cart_items = CartItem.objects.filter(cart=cart)
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

        # clear cart
        cart_items.delete()

    return Response({
        "message": "Order placed successfully",
        "order_id": order.id
    }, status=201)
        
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response({"message" : "User created successfully!", "user" : UserSerializer(user).data}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
