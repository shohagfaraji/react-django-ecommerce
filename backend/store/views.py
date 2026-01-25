from rest_framework.response import Response
from rest_framework.decorators import api_view
from .models import Product, Category, Cart, CartItem, Order, OrderItem
from .serializers import ProductSerializer, CategorySerializer, CartSerializer, CartItemSerializer

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
def get_cart(request):
    cart, created = Cart.objects.get_or_create(user=None)
    serializer = CartSerializer(cart)
    return Response(serializer.data)

@api_view(['POST'])
def add_to_cart(request):
    product_id = request.data.get('product_id')
    product = Product.objects.get(id=product_id)
    cart, created = Cart.objects.get_or_create(user=None)
    item, created = CartItem.objects.get_or_create(cart=cart, product=product)
    
    if not created:
        item.quantity += 1
        item.save()
    return Response({'message': 'Product added to cart',"cart":CartSerializer(cart).data})

@api_view(['POST'])
def update_cart_quantity(request):
    item_id = request.data.get('item_id')
    quantity = request.data.get('quantity')

    cart = Cart.objects.filter(user=None).first()
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
def remove_from_cart(request):
    item_id = request.data.get('item_id')
    cart = Cart.objects.filter(user=None).first()

    if cart:
        CartItem.objects.filter(cart=cart, id=item_id).delete()

    return Response({"message": "Item removed"})

@api_view(['POST'])
def create_order(request):
    try:
        data = request.data
        name = data.get('name')
        address = data.get('address')
        phone = data.get('phone')
        payment_method = data.get('payment_method', 'COD')
        
        cart = Cart.objects.filter(user=None).first()
        
        if not cart or not cart.items.exists():
            return Response({'error' : 'Cart is empty'}, status=400)
        
        total = sum(float(item.product.price) * item.quantity for item in cart.items.all())
        
        # Create Order
        order = Order.objects.create(
            user = None,
            total_amount = total,
        )
        
        # Create Order Items
        for item in cart.items.all():
            OrderItem.objects.create(
                order = order,
                product = item.product,
                quantity = item.quantity,
                price = item.product.price,
            )
        
        # Clear the cart
        cart.items.all().delete()
        
        return Response({
            "message" : "Order Placed Successfully!",
            "order_id" : order.id,
        })
    
    except Exception as e:
        return Response({"error" : str(e)}, status=500)
        