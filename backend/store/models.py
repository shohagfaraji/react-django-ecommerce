from django.db import models
from django.contrib.auth.models import User
from cloudinary.models import CloudinaryField

class Category(models.Model):
    SECTION_CHOICES = [
        ('clothing', 'Clothing'),
        ('electronics', 'Electronics'),
        ('toys', 'Toys'),
        ('garden', 'Garden'),
        ('home', 'Home & Living'),
        ('beauty', 'Beauty & Personal Care'),
        ('sports', 'Sports & Outdoors'),
        ('other', 'Other'),
    ]

    name = models.CharField(max_length = 100)
    slug = models.SlugField(unique = True)
    parent = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        related_name='children',
        on_delete=models.CASCADE,
    )
    section = models.CharField(max_length=30, choices=SECTION_CHOICES, default='other')
    description = models.CharField(max_length=240, blank=True)
    image = CloudinaryField('image', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False, help_text="Show this category on the home page.")
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name_plural = 'categories'
        ordering = ['sort_order', 'name']
        indexes = [
            models.Index(fields=['parent']),
            models.Index(fields=['section']),
            models.Index(fields=['is_featured']),
            models.Index(fields=['is_active', 'parent']),
            models.Index(fields=['is_featured', 'is_active']),
        ]

    def __str__(self):
        if self.parent:
            return f"{self.parent.name} / {self.name}"
        return self.name

class Product(models.Model):
    category = models.ForeignKey(Category, related_name='products', on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = CloudinaryField('image', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_weekly_top = models.BooleanField(default=False, help_text="Mark as Weekly Top Selling product")
    is_hot = models.BooleanField(default=False, help_text="Show as hot/most selling product on the home page")
    is_featured = models.BooleanField(default=False, help_text="Admin-selected product for category shelves")
    discount_percentage = models.PositiveSmallIntegerField(
        default=0,
        help_text="Discount % for this product (0 = no discount)."
    )

    class Meta:
        indexes = [
            models.Index(fields=['category']),
            models.Index(fields=['-created_at']),
            models.Index(fields=['is_hot']),
            models.Index(fields=['is_featured']),
            models.Index(fields=['is_weekly_top']),
            models.Index(fields=['discount_percentage']),
            models.Index(fields=['is_hot', 'is_weekly_top']),
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
class HeroBanner(models.Model):
    title = models.CharField(max_length=200)
    subtitle = models.CharField(max_length=300, blank=True)
    image = CloudinaryField('image')
    category = models.ForeignKey(
        Category,
        null=True,
        on_delete=models.SET_NULL,
        related_name='hero_banners',
        limit_choices_to={'parent__isnull': True, 'is_active': True},
        help_text="Top-level category to open when this banner is clicked.",
    )
    button_text = models.CharField(max_length=60, default='Shop now')
    is_active = models.BooleanField(default=True)
    show_on_home = models.BooleanField(default=True, help_text="Only selected banners appear in the home slider.")
    starts_at = models.DateTimeField(null=True, blank=True)
    ends_at = models.DateTimeField(null=True, blank=True)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['sort_order', '-created_at']
        indexes = [
            models.Index(fields=['is_active', 'show_on_home']),
            models.Index(fields=['sort_order']),
            models.Index(fields=['starts_at', 'ends_at']),
        ]

    def __str__(self):
        return self.title
