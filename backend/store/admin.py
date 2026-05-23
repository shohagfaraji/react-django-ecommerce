from django.contrib import admin
from .models import Category, Product, Order, OrderItem, Cart, CartItem, UserProfile, OfferBanner

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'discount_percentage', 'offer_banner', 'is_weekly_top', 'created_at')
    list_filter = ('category', 'is_weekly_top', 'offer_banner')
    search_fields = ('name',)
    list_editable = ('discount_percentage', 'offer_banner', 'is_weekly_top')
    raw_id_fields = ('offer_banner',)

@admin.register(OfferBanner)
class OfferBannerAdmin(admin.ModelAdmin):
    list_display = ('title', 'theme', 'max_discount', 'show_from', 'event_start', 'event_end', 'is_active')
    list_filter = ('theme', 'is_active')

admin.site.register(Category)
admin.site.register(Order)
admin.site.register(OrderItem)
admin.site.register(Cart)
admin.site.register(CartItem)
admin.site.register(UserProfile)