from django.db import models
from django.contrib.auth.models import User
from cloudinary.models import CloudinaryField

class Category(models.Model):
    name = models.CharField(max_length = 100, unique = True)
    slug = models.SlugField(unique = True)

    def __str__(self):
        return self.name

class Product(models.Model):
    category = models.ForeignKey(Category, related_name='products', on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = CloudinaryField('image', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_weekly_top = models.BooleanField(default=False, help_text="Mark as Weekly Top Selling product")
    discount_percentage = models.PositiveSmallIntegerField(
        default=0,
        help_text="Discount % for this product (0 = no discount). Active only during linked offer banner period."
    )
    offer_banner = models.ForeignKey(
        'OfferBanner',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='products',
        help_text="Link to the offer banner whose show_from/event_end controls when this discount is visible."
    )

    class Meta:
        indexes = [
            models.Index(fields=['category']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return self.name
    
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete = models.CASCADE)
    phone = models.CharField(max_length = 15, blank = True)
    address = models.TextField(blank=True)

    def __str__(self):
        return self.user.username

class Order(models.Model):
    user = models.ForeignKey(User, on_delete = models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add = True)
    total_amount = models.DecimalField(max_digits = 10, decimal_places = 2)

    def __str__(self):
        return f"Order {self.id} by {self.user.username}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name = 'items', on_delete = models.CASCADE)
    product = models.ForeignKey(Product, on_delete = models.CASCADE)
    quantity = models.PositiveIntegerField(default = 1)
    price = models.DecimalField(max_digits = 10, decimal_places = 2)

    def __str__(self):
        return f"{self.product.name} x{self.quantity}"
    
class Cart(models.Model):
    user = models.ForeignKey(User, on_delete = models.CASCADE, null = True, blank = True)
    created_at = models.DateTimeField(auto_now_add = True)

    def __str__(self):
        return f"Cart {self.id} for {self.user}"
    
    @property
    def total(self):
        return sum(item.subtotal for item in self.items.all())
    
class CartItem(models.Model):
    cart = models.ForeignKey(Cart, related_name='items', on_delete = models.CASCADE)
    product = models.ForeignKey(Product, on_delete = models.CASCADE)
    quantity = models.PositiveIntegerField(default = 1)

    @property
    def subtotal(self):
        return self.quantity * self.product.price
    
    def __str__(self):
        return f"{self.product.name} x{self.quantity}"
    
class OfferBanner(models.Model):
    THEME_CHOICES = [
        ('eid_ul_fitr', 'Eid ul Fitr'),
        ('eid_ul_adha', 'Eid ul Adha'),
        ('winter', 'Winter Sale'),
        ('summer', 'Summer Sale'),
        ('monsoon', 'Monsoon Sale'),
        ('puja', 'Puja Season'),
        ('default', 'Default'),
    ]

    title = models.CharField(max_length=200)
    tagline = models.CharField(max_length=300, blank=True)
    max_discount = models.PositiveIntegerField(help_text="Max discount % to show e.g. 50")
    theme = models.CharField(max_length=20, choices=THEME_CHOICES, default='default')

    show_from = models.DateTimeField(help_text="When to start showing this banner on site")
    event_start = models.DateTimeField(help_text="Offer starts: countdown shows time left until this")
    event_end = models.DateTimeField(help_text="Offer ends: countdown shows time left to end after start")

    is_active = models.BooleanField(default=True, help_text="Master switch to enable/disable this banner")

    class Meta:
        ordering = ['-show_from']

    def __str__(self):
        return self.title