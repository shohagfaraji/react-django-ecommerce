from pathlib import Path
from urllib.parse import urlparse

from django.conf import settings
from rest_framework import serializers
from .models import Product, Category, Cart, CartItem, HeroBanner
from django.contrib.auth.models import User


def optimize_cloudinary_url(url, width=900):
    if "res.cloudinary.com" not in url or "/image/upload/" not in url:
        return url

    transformations = f"f_auto,q_auto,c_limit,w_{width}"
    if f"/image/upload/{transformations}/" in url:
        return url
    return url.replace("/image/upload/", f"/image/upload/{transformations}/", 1)


def resolve_image_url(image, request=None, width=900):
    if not image:
        return None

    image_name = str(image)
    if image_name.startswith(("http://", "https://")):
        image_url = image_name.replace("http://res.cloudinary.com/", "https://res.cloudinary.com/")
        return optimize_cloudinary_url(image_url, width)

    try:
        image_url = image.url.replace("http://res.cloudinary.com/", "https://res.cloudinary.com/")
    except Exception:
        image_url = None

    if settings.DEBUG:
        local_candidates = [
            image_name,
            image_name.removeprefix("image/upload/"),
        ]

        if image_url:
            suffix = Path(urlparse(image_url).path).suffix
            if suffix and not Path(image_name).suffix:
                local_candidates.extend(
                    [
                        f"{image_name}{suffix}",
                        f"{image_name.removeprefix('image/upload/')}{suffix}",
                    ]
                )

        for local_name in dict.fromkeys(local_candidates):
            local_path = Path(settings.MEDIA_ROOT) / local_name
            if local_path.exists():
                media_url = f"{settings.MEDIA_URL}{local_name}".replace("\\", "/")
                if request:
                    return request.build_absolute_uri(media_url)
                return media_url

    if image_url:
        return optimize_cloudinary_url(image_url, width)

    try:
        image_url = image.url.replace("http://res.cloudinary.com/", "https://res.cloudinary.com/")
        return optimize_cloudinary_url(image_url, width)
    except Exception:
        cloud_name = getattr(settings, "CLOUDINARY_STORAGE", {}).get("CLOUD_NAME")
        if cloud_name:
            return optimize_cloudinary_url(
                f"https://res.cloudinary.com/{cloud_name}/image/upload/{image_name}",
                width,
            )
        media_url = f"{settings.MEDIA_URL}{image_name}".replace("\\", "/")
        if request:
            return request.build_absolute_uri(media_url)
        return media_url

class CategorySerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = '__all__'

    def get_image_url(self, obj):
        return resolve_image_url(obj.image, self.context.get('request'), width=320)

    def get_children(self, obj):
        prefetched_children = getattr(obj, '_prefetched_objects_cache', {}).get('children')
        if prefetched_children is not None:
            children = [child for child in prefetched_children if child.is_active]
        else:
            children = obj.children.filter(is_active=True).order_by('sort_order', 'name')
        return CategorySerializer(children, many=True, context=self.context).data

class CategorySummarySerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'section', 'parent', 'image_url']

    def get_image_url(self, obj):
        return resolve_image_url(obj.image, self.context.get('request'), width=320)

class ProductSerializer(serializers.ModelSerializer):
    category = CategorySummarySerializer(read_only=True)
    image_url = serializers.SerializerMethodField()
    active_discount = serializers.SerializerMethodField()
    discounted_price = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = '__all__'

    def get_image_url(self, obj):
        return resolve_image_url(obj.image, self.context.get('request'), width=640)

    def get_active_discount(self, obj):
        return obj.discount_percentage if obj.discount_percentage > 0 else 0

    def get_discounted_price(self, obj):
        """Returns the sale price if offer is active, else None."""
        discount = self.get_active_discount(obj)
        if discount > 0:
            from decimal import Decimal, ROUND_HALF_UP
            sale = Decimal(str(obj.price)) * (1 - Decimal(discount) / 100)
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
        return resolve_image_url(obj.product.image, self.context.get('request'), width=320)

    def get_product_active_discount(self, obj):
        p = obj.product
        return p.discount_percentage if p.discount_percentage > 0 else 0

    def get_product_discounted_price(self, obj):
        discount = self.get_product_active_discount(obj)
        if discount > 0:
            from decimal import Decimal, ROUND_HALF_UP
            sale = Decimal(str(obj.product.price)) * (1 - Decimal(discount) / 100)
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

class HeroBannerSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    target_url = serializers.SerializerMethodField()

    class Meta:
        model = HeroBanner
        fields = '__all__'

    def get_image_url(self, obj):
        return resolve_image_url(obj.image, self.context.get('request'), width=1200)

    def get_target_url(self, obj):
        if obj.product_id:
            return f"/product/{obj.product_id}"
        if obj.category:
            return f"/products?category={obj.category.slug}"
        return "/products"
