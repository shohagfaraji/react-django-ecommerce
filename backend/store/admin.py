from django.contrib import admin
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.files.storage import FileSystemStorage
import cloudinary.uploader

from .models import Category, Product, Order, OrderItem, Cart, CartItem, UserProfile, HeroBanner
from .cache_utils import bump_store_cache_version

class StoreCacheInvalidationAdminMixin:
    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        bump_store_cache_version()

    def delete_model(self, request, obj):
        super().delete_model(request, obj)
        bump_store_cache_version()

    def delete_queryset(self, request, queryset):
        super().delete_queryset(request, queryset)
        bump_store_cache_version()

class ImageUploadAdminMixin:
    image_folder = 'admin_uploads'

    def save_model(self, request, obj, form, change):
        image = form.cleaned_data.get('image') if 'image' in form.cleaned_data else None
        if image and hasattr(image, 'read'):
            if settings.DEBUG:
                storage = FileSystemStorage(location=settings.MEDIA_ROOT)
                saved_name = storage.save(f"{self.image_folder}/{image.name}", image)
                obj.image = saved_name
            else:
                try:
                    upload_result = cloudinary.uploader.upload(
                        image,
                        folder=self.image_folder,
                        resource_type='image',
                        use_filename=True,
                        unique_filename=True,
                        overwrite=False,
                    )
                except Exception as exc:
                    raise ValidationError(f"Cloudinary upload failed: {exc}") from exc

                obj.image = upload_result['public_id']
        super().save_model(request, obj, form, change)

@admin.register(Product)
class ProductAdmin(ImageUploadAdminMixin, StoreCacheInvalidationAdminMixin, admin.ModelAdmin):
    image_folder = 'products'
    list_display = ('name', 'category', 'price', 'discount_percentage', 'is_hot', 'is_featured', 'is_weekly_top', 'created_at')
    list_filter = ('category__section', 'is_hot', 'is_featured', 'is_weekly_top')
    search_fields = ('name', 'category__name')
    list_editable = ('discount_percentage', 'is_hot', 'is_featured', 'is_weekly_top')
    autocomplete_fields = ('category',)
    list_select_related = ('category',)
    ordering = ('-created_at',)
    show_full_result_count = False
    list_per_page = 25

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('category', 'category__parent')

@admin.register(Category)
class CategoryAdmin(ImageUploadAdminMixin, StoreCacheInvalidationAdminMixin, admin.ModelAdmin):
    image_folder = 'categories'
    list_display = ('name', 'parent', 'section', 'is_featured', 'is_active', 'sort_order')
    list_filter = ('section', 'is_featured', 'is_active', 'parent')
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ('is_featured', 'is_active', 'sort_order')
    autocomplete_fields = ('parent',)
    list_select_related = ('parent',)
    ordering = ('sort_order', 'name')
    show_full_result_count = False
    list_per_page = 25

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('parent')

@admin.register(HeroBanner)
class HeroBannerAdmin(ImageUploadAdminMixin, StoreCacheInvalidationAdminMixin, admin.ModelAdmin):
    image_folder = 'hero_banners'
    list_display = ('title', 'category', 'show_on_home', 'is_active', 'sort_order', 'starts_at', 'ends_at')
    list_filter = ('show_on_home', 'is_active', 'category')
    search_fields = ('title', 'subtitle')
    list_editable = ('show_on_home', 'is_active', 'sort_order')
    autocomplete_fields = ('category',)
    list_select_related = ('category',)
    ordering = ('sort_order', '-created_at')
    show_full_result_count = False
    list_per_page = 25

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('category')

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'category':
            kwargs['queryset'] = Category.objects.filter(
                parent__isnull=True,
                is_active=True,
            ).order_by('sort_order', 'name')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'total_amount', 'created_at')
    search_fields = ('id', 'user__username', 'user__email')
    list_select_related = ('user',)
    ordering = ('-created_at',)
    show_full_result_count = False
    list_per_page = 25


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('order', 'product', 'quantity', 'price')
    autocomplete_fields = ('order', 'product')
    list_select_related = ('order', 'product')
    show_full_result_count = False
    list_per_page = 25


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'created_at')
    search_fields = ('id', 'user__username', 'user__email')
    autocomplete_fields = ('user',)
    list_select_related = ('user',)
    ordering = ('-created_at',)
    show_full_result_count = False
    list_per_page = 25


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ('cart', 'product', 'quantity')
    autocomplete_fields = ('cart', 'product')
    list_select_related = ('cart', 'product')
    show_full_result_count = False
    list_per_page = 25


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'phone')
    autocomplete_fields = ('user',)
    list_select_related = ('user',)
    show_full_result_count = False
    list_per_page = 25
