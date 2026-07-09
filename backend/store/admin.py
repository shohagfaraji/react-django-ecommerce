from django.contrib import admin
from django.conf import settings
from django.core.files.storage import FileSystemStorage
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

class LocalImageUploadAdminMixin:
    local_image_folder = 'admin_uploads'

    def save_model(self, request, obj, form, change):
        image = form.cleaned_data.get('image') if 'image' in form.cleaned_data else None
        if settings.DEBUG and image and hasattr(image, 'read'):
            storage = FileSystemStorage(location=settings.MEDIA_ROOT)
            saved_name = storage.save(f"{self.local_image_folder}/{image.name}", image)
            obj.image = saved_name
        super().save_model(request, obj, form, change)

@admin.register(Product)
class ProductAdmin(LocalImageUploadAdminMixin, StoreCacheInvalidationAdminMixin, admin.ModelAdmin):
    local_image_folder = 'products'
    list_display = ('name', 'category', 'price', 'discount_percentage', 'is_hot', 'is_featured', 'is_weekly_top', 'created_at')
    list_filter = ('category', 'is_hot', 'is_featured', 'is_weekly_top')
    search_fields = ('name', 'description')
    list_editable = ('discount_percentage', 'is_hot', 'is_featured', 'is_weekly_top')
    autocomplete_fields = ('category',)
    list_select_related = ('category',)
    ordering = ('-created_at',)
    show_full_result_count = False

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('category', 'category__parent')

@admin.register(Category)
class CategoryAdmin(LocalImageUploadAdminMixin, StoreCacheInvalidationAdminMixin, admin.ModelAdmin):
    local_image_folder = 'categories'
    list_display = ('name', 'parent', 'section', 'is_featured', 'is_active', 'sort_order')
    list_filter = ('section', 'is_featured', 'is_active', 'parent')
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ('is_featured', 'is_active', 'sort_order')
    autocomplete_fields = ('parent',)
    list_select_related = ('parent',)
    ordering = ('sort_order', 'name')
    show_full_result_count = False

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('parent')

@admin.register(HeroBanner)
class HeroBannerAdmin(LocalImageUploadAdminMixin, StoreCacheInvalidationAdminMixin, admin.ModelAdmin):
    local_image_folder = 'hero_banners'
    list_display = ('title', 'category', 'product', 'show_on_home', 'is_active', 'sort_order', 'starts_at', 'ends_at')
    list_filter = ('show_on_home', 'is_active', 'category')
    search_fields = ('title', 'subtitle')
    list_editable = ('show_on_home', 'is_active', 'sort_order')
    autocomplete_fields = ('category', 'product')
    list_select_related = ('category', 'product')
    ordering = ('sort_order', '-created_at')
    show_full_result_count = False

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('category', 'product')

admin.site.register(Order)
admin.site.register(OrderItem)
admin.site.register(Cart)
admin.site.register(CartItem)
admin.site.register(UserProfile)
