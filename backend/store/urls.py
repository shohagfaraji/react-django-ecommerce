from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/', views.register),
    path('register/check-username/', views.check_username),
    path('token/', views.login_token, name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    path('products/', views.get_products),
    path('products/weekly-top-selling/', views.get_weekly_top_selling),
    path('products/new-arrivals/', views.get_new_arrivals),
    path('products/sale/', views.get_sale_products),
    path('product/<int:pk>/', views.get_product),
    path('products/<int:pk>/reviews/', views.product_reviews),
    path('reviews/', views.create_review),
    path('reviews/<int:pk>/', views.review_detail),
    path('categories/', views.get_categories),
    path('hero-banners/', views.get_hero_banners),
    path('homepage/', views.get_homepage),
    path('cart/', views.get_cart),
    path('cart/add/', views.add_to_cart),
    path('cart/remove/', views.remove_from_cart),
    path('cart/update/', views.update_cart_quantity),
    path('orders/create/', views.create_order),
    path('orders/', views.user_orders),
    path('orders/<int:pk>/', views.user_order_detail),
    path('profile/', views.user_profile),
    path('profile/password/', views.change_password),
    path('profile/password/check/', views.check_current_password),
    path('profile/delete/', views.delete_account),
    path('bootstrap-superuser/', views.bootstrap_superuser),
]
