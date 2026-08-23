import os
from pathlib import Path
from uuid import uuid4

import cloudinary.uploader
from django.conf import settings
from django.core.files.storage import FileSystemStorage
from django.db import transaction
from rest_framework import serializers

from .models import Category, HeroBanner, Order, Product, Review
from .serializers import ReviewImageSerializer, resolve_image_url


def save_dashboard_image(image, folder):
    safe_name = Path(image.name).name
    unique_name = f"{uuid4().hex}-{safe_name}"
    if settings.USE_CLOUDINARY_MEDIA:
        uploaded = cloudinary.uploader.upload(
            image,
            folder=folder,
            resource_type='image',
            use_filename=False,
            unique_filename=True,
            overwrite=False,
        )
        return uploaded['public_id']

    storage = FileSystemStorage(location=settings.MEDIA_ROOT)
    return storage.save(os.path.join(folder, unique_name), image)


def delete_dashboard_image(image_name):
    if not image_name:
        return
    try:
        if settings.USE_CLOUDINARY_MEDIA:
            cloudinary.uploader.destroy(image_name, resource_type='image')
        else:
            storage = FileSystemStorage(location=settings.MEDIA_ROOT)
            if storage.exists(image_name):
                storage.delete(image_name)
    except Exception:
        pass


class DashboardImageSerializerMixin:
    image_folder = 'admin_uploads'

    def validate_image_upload(self, image):
        if image.size > 5 * 1024 * 1024:
            raise serializers.ValidationError('Images must be 5 MB or smaller.')
        content_type = getattr(image, 'content_type', '')
        if content_type and not content_type.startswith('image/'):
            raise serializers.ValidationError('Upload a valid image file.')
        return image

    def create(self, validated_data):
        image = validated_data.pop('image_upload', None)
        instance = super().create(validated_data)
        if image:
            instance.image = save_dashboard_image(image, self.image_folder)
            instance.save(update_fields=['image'])
        return instance

    def update(self, instance, validated_data):
        image = validated_data.pop('image_upload', None)
        previous_image = str(instance.image) if instance.image else ''
        instance = super().update(instance, validated_data)
        if image:
            instance.image = save_dashboard_image(image, self.image_folder)
            instance.save(update_fields=['image'])
            if previous_image:
                transaction.on_commit(
                    lambda: delete_dashboard_image(previous_image)
                )
        return instance


class AdminProductSerializer(
    DashboardImageSerializerMixin,
    serializers.ModelSerializer,
):
    category_name = serializers.CharField(source='category.name', read_only=True)
    image_url = serializers.SerializerMethodField()
    image_upload = serializers.ImageField(write_only=True, required=False)

    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'description',
            'price',
            'category',
            'category_name',
            'image_url',
            'image_upload',
            'discount_percentage',
            'is_hot',
            'is_featured',
            'is_weekly_top',
            'average_rating',
            'review_count',
            'created_at',
        ]
        read_only_fields = [
            'average_rating',
            'review_count',
            'created_at',
        ]

    image_folder = 'products'

    def get_image_url(self, obj):
        return resolve_image_url(
            obj.image,
            self.context.get('request'),
            width=640,
        )

    def validate_discount_percentage(self, value):
        if value > 100:
            raise serializers.ValidationError(
                'Discount percentage cannot exceed 100.'
            )
        return value


class AdminCategorySerializer(
    DashboardImageSerializerMixin,
    serializers.ModelSerializer,
):
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    image_url = serializers.SerializerMethodField()
    image_upload = serializers.ImageField(write_only=True, required=False)

    class Meta:
        model = Category
        fields = [
            'id',
            'name',
            'slug',
            'parent',
            'parent_name',
            'section',
            'description',
            'image_url',
            'image_upload',
            'is_active',
            'is_featured',
            'sort_order',
        ]

    image_folder = 'categories'

    def get_image_url(self, obj):
        return resolve_image_url(
            obj.image,
            self.context.get('request'),
            width=400,
        )

    def validate_parent(self, parent):
        ancestor = parent
        while self.instance and ancestor:
            if ancestor.pk == self.instance.pk:
                raise serializers.ValidationError(
                    'A category cannot be placed under itself or its children.'
                )
            ancestor = ancestor.parent
        return parent


class AdminHeroBannerSerializer(
    DashboardImageSerializerMixin,
    serializers.ModelSerializer,
):
    category_name = serializers.CharField(source='category.name', read_only=True)
    image_url = serializers.SerializerMethodField()
    image_upload = serializers.ImageField(write_only=True, required=False)

    class Meta:
        model = HeroBanner
        fields = [
            'id',
            'title',
            'subtitle',
            'image_url',
            'image_upload',
            'category',
            'category_name',
            'button_text',
            'is_active',
            'show_on_home',
            'starts_at',
            'ends_at',
            'sort_order',
            'created_at',
        ]
        read_only_fields = ['created_at']

    image_folder = 'hero_banners'

    def get_image_url(self, obj):
        return resolve_image_url(
            obj.image,
            self.context.get('request'),
            width=1200,
        )

    def validate(self, attrs):
        if self.instance is None and not attrs.get('image_upload'):
            raise serializers.ValidationError({
                'image_upload': ['Choose an image for the banner.'],
            })

        starts_at = attrs.get(
            'starts_at',
            getattr(self.instance, 'starts_at', None),
        )
        ends_at = attrs.get(
            'ends_at',
            getattr(self.instance, 'ends_at', None),
        )
        if starts_at and ends_at and starts_at >= ends_at:
            raise serializers.ValidationError({
                'ends_at': ['The end time must be later than the start time.'],
            })
        return attrs


class AdminOrderSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    status_display = serializers.CharField(
        source='get_status_display',
        read_only=True,
    )
    item_count = serializers.IntegerField(source='item_count_value', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'username',
            'recipient_name',
            'phone',
            'delivery_address',
            'payment_method',
            'total_amount',
            'status',
            'status_display',
            'item_count',
            'created_at',
            'updated_at',
        ]


class AdminReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    images = ReviewImageSerializer(many=True, read_only=True)

    class Meta:
        model = Review
        fields = [
            'id',
            'product',
            'product_name',
            'username',
            'rating',
            'comment',
            'created_at',
            'images',
        ]
