from rest_framework import serializers
from .models import Product, Category, Cart, CartItem, OfferBanner
from django.contrib.auth.models import User

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    image_url = serializers.SerializerMethodField()
    active_discount = serializers.SerializerMethodField()
    discounted_price = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = '__all__'

    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url
        return None

    def get_active_discount(self, obj):
        """Returns discount_percentage only during the actual offer window (event_start → event_end)."""
        if obj.discount_percentage <= 0 or not obj.offer_banner:
            return 0
        from django.utils import timezone
        now = timezone.now()
        b = obj.offer_banner
        if b.is_active and b.event_start <= now <= b.event_end:
            return obj.discount_percentage
        return 0

    def get_discounted_price(self, obj):
        """Returns the sale price if offer is active, else None."""
        discount = self.get_active_discount(obj)
        if discount > 0:
            from decimal import Decimal, ROUND_HALF_UP
            sale = obj.price * (1 - Decimal(discount) / 100)
            return str(sale.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
        return None

class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_price = serializers.DecimalField(source='product.price', max_digits=10, decimal_places=2, read_only=True)
    product_image = serializers.SerializerMethodField()
    product_active_discount = serializers.SerializerMethodField()
    product_discounted_price = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = '__all__'

    def get_product_image(self, obj):
        if obj.product.image:
            return obj.product.image.url
        return None

    def get_product_active_discount(self, obj):
        """Reuse the same offer window logic: active only between event_start and event_end."""
        p = obj.product
        if p.discount_percentage <= 0 or not p.offer_banner:
            return 0
        from django.utils import timezone
        now = timezone.now()
        b = p.offer_banner
        if b.is_active and b.event_start <= now <= b.event_end:
            return p.discount_percentage
        return 0

    def get_product_discounted_price(self, obj):
        discount = self.get_product_active_discount(obj)
        if discount > 0:
            from decimal import Decimal, ROUND_HALF_UP
            sale = obj.product.price * (1 - Decimal(discount) / 100)
            return str(sale.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
        return None

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.ReadOnlyField()

    class Meta:
        model = Cart
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError("Password do not match!")
        return attrs

    def create(self, validated_data):
        username = validated_data['username']
        email = validated_data.get('email', '')
        password = validated_data['password']
        user = User.objects.create_user(username=username, email=email, password=password)
        return user

class OfferBannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = OfferBanner
        fields = '__all__'
