from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('register/', views.register),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    path('products/', views.get_products),
    path('products/weekly-top-selling/', views.get_weekly_top_selling),
    path('products/new-arrivals/', views.get_new_arrivals),
    path('products/sale/', views.get_sale_products),
    path('product/<int:pk>/', views.get_product),
    path('categories/', views.get_categories),
    path('hero-banners/', views.get_hero_banners),
    path('homepage/', views.get_homepage),
    path('cart/', views.get_cart),
    path('cart/add/', views.add_to_cart),
    path('cart/remove/', views.remove_from_cart),
    path('cart/update/', views.update_cart_quantity),
    path('orders/create/', views.create_order),
    path('bootstrap-superuser/', views.bootstrap_superuser),
]
