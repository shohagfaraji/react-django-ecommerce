from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
from uuid import uuid4
from urllib.parse import urlparse

import cloudinary.uploader
from django.conf import settings
from django.contrib.auth.models import User
from django.core.files.storage import FileSystemStorage
from rest_framework import serializers
from .models import (
    Product,
    Category,
    Cart,
    CartItem,
    HeroBanner,
    Order,
    OrderItem,
    Review,
    ReviewImage,
    UserProfile,
)


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
        children_by_parent = self.context.get('children_by_parent')
        if children_by_parent is not None:
            children = children_by_parent.get(obj.id, [])
            return CategorySerializer(
                children,
                many=True,
                context=self.context,
            ).data

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
    average_rating = serializers.FloatField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Product
        fields = '__all__'

    def get_image_url(self, obj):
        return resolve_image_url(obj.image, self.context.get('request'), width=640)

    def get_active_discount(self, obj):
        return obj.discount_percentage if obj.discount_percentage > 0 else 0

    def get_discounted_price(self, obj):
        discount = self.get_active_discount(obj)
        if discount > 0:
            sale = Decimal(str(obj.price)) * (1 - Decimal(discount) / 100)
            return str(sale.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
        return None

class ProductListSerializer(ProductSerializer):
    class Meta(ProductSerializer.Meta):
        fields = [
            'id',
            'category',
            'name',
            'price',
            'image_url',
            'created_at',
            'is_weekly_top',
            'is_hot',
            'is_featured',
            'discount_percentage',
            'active_discount',
            'discounted_price',
            'average_rating',
            'review_count',
        ]

    def get_image_url(self, obj):
        return resolve_image_url(obj.image, self.context.get('request'), width=640)


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
        return resolve_image_url(obj.product.image, self.context.get('request'), width=640)

    def get_product_active_discount(self, obj):
        p = obj.product
        return p.discount_percentage if p.discount_percentage > 0 else 0

    def get_product_discounted_price(self, obj):
        discount = self.get_product_active_discount(obj)
        if discount > 0:
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


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', max_length=150)
    email = serializers.EmailField(source='user.email', allow_blank=True, required=False)
    name = serializers.CharField(source='full_name', max_length=150, allow_blank=True, required=False)
    profile_picture = serializers.ImageField(write_only=True, required=False)
    profile_picture_avatar_url = serializers.SerializerMethodField()
    profile_picture_thumbnail_url = serializers.SerializerMethodField()
    profile_picture_url = serializers.SerializerMethodField()
    order_count = serializers.IntegerField(read_only=True, default=0)
    is_staff = serializers.BooleanField(source='user.is_staff', read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            'username',
            'name',
            'email',
            'phone',
            'address',
            'profile_picture',
            'profile_picture_avatar_url',
            'profile_picture_thumbnail_url',
            'profile_picture_url',
            'order_count',
            'is_staff',
        ]

    def validate_username(self, value):
        username = value.strip()
        if not username:
            raise serializers.ValidationError("Enter a username.")
        if any(char.isspace() for char in value):
            raise serializers.ValidationError("Username cannot contain spaces.")

        current_user = self.instance.user if self.instance else None
        matches = User.objects.filter(username__iexact=username)
        if current_user:
            matches = matches.exclude(pk=current_user.pk)
        if matches.exists():
            raise serializers.ValidationError("This username is already taken.")
        return username

    def validate_profile_picture(self, image):
        if image.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("Profile picture must be 5 MB or smaller.")
        content_type = getattr(image, 'content_type', '')
        if content_type and not content_type.startswith('image/'):
            raise serializers.ValidationError("Upload a valid image file.")
        return image

    def get_profile_picture_url(self, obj):
        return resolve_image_url(
            obj.profile_picture,
            self.context.get('request'),
            width=400,
        )

    def get_profile_picture_avatar_url(self, obj):
        return resolve_image_url(
            obj.profile_picture,
            self.context.get('request'),
            width=96,
        )

    def get_profile_picture_thumbnail_url(self, obj):
        return resolve_image_url(
            obj.profile_picture,
            self.context.get('request'),
            width=160,
        )

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        picture = validated_data.pop('profile_picture', None)
        previous_picture = str(instance.profile_picture) if instance.profile_picture else ''

        for field, value in validated_data.items():
            setattr(instance, field, value)

        if user_data:
            instance.user.username = user_data.get('username', instance.user.username)
            instance.user.email = user_data.get('email', instance.user.email)
            instance.user.save(update_fields=['username', 'email'])

        if picture:
            instance.profile_picture = self._save_profile_picture(picture, instance.user_id)

        instance.save()
        if picture and previous_picture:
            self._delete_profile_picture(previous_picture)
        return instance

    def _save_profile_picture(self, picture, user_id):
        safe_name = Path(picture.name).name
        unique_name = f"{uuid4().hex}-{safe_name}"

        if not settings.USE_CLOUDINARY_MEDIA:
            storage = FileSystemStorage(location=settings.MEDIA_ROOT)
            return storage.save(f"profile_pictures/{user_id}/{unique_name}", picture)

        try:
            uploaded = cloudinary.uploader.upload(
                picture,
                folder=f"profile_pictures/{user_id}",
                resource_type='image',
                use_filename=False,
                unique_filename=True,
                overwrite=False,
            )
        except Exception as exc:
            raise serializers.ValidationError({
                'profile_picture': f"Profile picture upload failed: {exc}",
            }) from exc
        return uploaded['public_id']

    def _delete_profile_picture(self, picture_name):
        try:
            if settings.USE_CLOUDINARY_MEDIA:
                cloudinary.uploader.destroy(picture_name, resource_type='image')
            else:
                storage = FileSystemStorage(location=settings.MEDIA_ROOT)
                if storage.exists(picture_name):
                    storage.delete(picture_name)
        except Exception:
            pass


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.SerializerMethodField()
    line_total = serializers.SerializerMethodField()
    review = serializers.SerializerMethodField()
    can_review = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = [
            'id',
            'product',
            'product_name',
            'product_image',
            'quantity',
            'price',
            'line_total',
            'review',
            'can_review',
        ]

    def get_product_image(self, obj):
        return resolve_image_url(
            obj.product.image,
            self.context.get('request'),
            width=320,
        )

    def get_line_total(self, obj):
        return f"{obj.price * obj.quantity:.2f}"

    def get_review(self, obj):
        try:
            review = obj.review
        except Review.DoesNotExist:
            return None
        return ReviewSerializer(review, context=self.context).data

    def get_can_review(self, obj):
        try:
            obj.review
            has_review = True
        except Review.DoesNotExist:
            has_review = False
        return obj.order.status == Order.STATUS_DELIVERED and not has_review


class ReviewImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ReviewImage
        fields = ['id', 'image_url']

    def get_image_url(self, obj):
        return resolve_image_url(obj.image, self.context.get('request'), width=900)


class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    images = ReviewImageSerializer(many=True, read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'username', 'rating', 'comment', 'created_at', 'images']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    item_count = serializers.SerializerMethodField()
    customer_order_number = serializers.IntegerField(read_only=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'customer_order_number',
            'created_at',
            'updated_at',
            'total_amount',
            'status',
            'status_display',
            'recipient_name',
            'phone',
            'delivery_address',
            'payment_method',
            'item_count',
            'items',
        ]

    def get_item_count(self, obj):
        return sum(item.quantity for item in obj.items.all())


class OrderListSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(
        source='get_status_display',
        read_only=True,
    )
    item_count = serializers.IntegerField(source='item_count_value', read_only=True)
    customer_order_number = serializers.IntegerField(read_only=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'customer_order_number',
            'created_at',
            'updated_at',
            'total_amount',
            'status',
            'status_display',
            'recipient_name',
            'phone',
            'delivery_address',
            'payment_method',
            'item_count',
        ]

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2']

    def validate_username(self, value):
        username = value.strip()
        if not username:
            raise serializers.ValidationError("Enter a username.")
        if any(char.isspace() for char in value):
            raise serializers.ValidationError("Username cannot contain spaces.")
        if User.objects.filter(username__iexact=username).exists():
            raise serializers.ValidationError("This username is already taken.")
        return username

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError("Password do not match!")
        return attrs

    def create(self, validated_data):
        username = validated_data['username']
        email = validated_data.get('email', '')
        password = validated_data['password']
        user = User.objects.create_user(username=username, email=email, password=password)
        UserProfile.objects.create(user=user)
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
        if obj.category:
            return f"/products?category={obj.category.slug}"
        return "/products"
