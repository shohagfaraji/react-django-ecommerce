from django.contrib import admin
from django.conf import settings
from django.core.cache import cache
from django.core.files.storage import FileSystemStorage
from .models import Category, Product, Order, OrderItem, Cart, CartItem, UserProfile, HeroBanner

class ClearStoreCacheAdminMixin:
    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        cache.clear()

    def delete_model(self, request, obj):
        super().delete_model(request, obj)
        cache.clear()

    def delete_queryset(self, request, queryset):
        super().delete_queryset(request, queryset)
        cache.clear()

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
class ProductAdmin(LocalImageUploadAdminMixin, ClearStoreCacheAdminMixin, admin.ModelAdmin):
    local_image_folder = 'products'
    list_display = ('name', 'category', 'price', 'discount_percentage', 'is_hot', 'is_featured', 'is_weekly_top', 'created_at')
    list_filter = ('category', 'is_hot', 'is_featured', 'is_weekly_top')
    search_fields = ('name', 'description')
    list_editable = ('discount_percentage', 'is_hot', 'is_featured', 'is_weekly_top')
    autocomplete_fields = ('category',)
    list_select_related = ('category',)

@admin.register(Category)
class CategoryAdmin(LocalImageUploadAdminMixin, ClearStoreCacheAdminMixin, admin.ModelAdmin):
    local_image_folder = 'categories'
    list_display = ('name', 'parent', 'section', 'is_featured', 'is_active', 'sort_order')
    list_filter = ('section', 'is_featured', 'is_active', 'parent')
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ('is_featured', 'is_active', 'sort_order')
    autocomplete_fields = ('parent',)

@admin.register(HeroBanner)
class HeroBannerAdmin(LocalImageUploadAdminMixin, ClearStoreCacheAdminMixin, admin.ModelAdmin):
    local_image_folder = 'hero_banners'
    list_display = ('title', 'category', 'product', 'show_on_home', 'is_active', 'sort_order', 'starts_at', 'ends_at')
    list_filter = ('show_on_home', 'is_active', 'category')
    search_fields = ('title', 'subtitle')
    list_editable = ('show_on_home', 'is_active', 'sort_order')
    autocomplete_fields = ('category', 'product')
    list_select_related = ('category', 'product')

admin.site.register(Order)
admin.site.register(OrderItem)
admin.site.register(Cart)
admin.site.register(CartItem)
admin.site.register(UserProfile)
