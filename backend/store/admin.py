from django.contrib import admin
from .models import Category, Product, UserProfile, Order, OrderItem


def mark_weekly_top(modeladmin, request, queryset):
    queryset.update(is_weekly_top=True)
mark_weekly_top.short_description = "Mark selected products as Weekly Top Selling"


def unmark_weekly_top(modeladmin, request, queryset):
    queryset.update(is_weekly_top=False)
unmark_weekly_top.short_description = "Remove selected products from Weekly Top Selling"


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'is_weekly_top', 'created_at')
    list_filter = ('is_weekly_top', 'category')
    list_editable = ('is_weekly_top',)
    search_fields = ('name', 'description')
    ordering = ('-created_at',)
    actions = [mark_weekly_top, unmark_weekly_top]


admin.site.register(Category)
admin.site.register(UserProfile)
admin.site.register(Order)
admin.site.register(OrderItem)
