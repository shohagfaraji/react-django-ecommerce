from decimal import Decimal
from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Category, Product, Cart, CartItem, Order, OfferBanner
from .serializers import ProductSerializer


# Helpers

def make_category(name="Electronics", slug="electronics"):
    return Category.objects.create(name=name, slug=slug)


def make_product(category, name="Test Product", price="100.00", **kwargs):
    return Product.objects.create(category=category, name=name, price=price, **kwargs)


def make_banner(now, hours_before_start=1, hours_after_end=1, is_active=True):
    """Creates an OfferBanner whose event window is currently open by default."""
    return OfferBanner.objects.create(
        title="Test Sale",
        tagline="Great deals",
        max_discount=50,
        theme="default",
        show_from=now - timedelta(days=1),
        event_start=now - timedelta(hours=hours_before_start),
        event_end=now + timedelta(hours=hours_after_end),
        is_active=is_active,
    )


# 1. Discount window logic (serializer)

class ProductDiscountTests(TestCase):
    """
    Tests for the server-side discount engine in ProductSerializer.
    The key rule: active_discount is only non-zero inside event_start → event_end,
    and only when the banner's is_active flag is True.
    """

    def setUp(self):
        self.category = make_category()
        now = timezone.now()
        self.banner = make_banner(now)
        self.product = make_product(
            self.category,
            price="1000.00",
            discount_percentage=20,
            offer_banner=self.banner,
        )

    def test_active_discount_during_event_window(self):
        """active_discount should equal discount_percentage while inside the event window."""
        data = ProductSerializer(self.product).data
        self.assertEqual(data["active_discount"], 20)

    def test_discounted_price_is_correct(self):
        """discounted_price should be price × (1 - discount / 100), rounded to 2 dp."""
        data = ProductSerializer(self.product).data
        self.assertEqual(data["discounted_price"], "800.00")

    def test_active_discount_zero_before_event_starts(self):
        """active_discount should be 0 if now is before event_start."""
        now = timezone.now()
        self.banner.event_start = now + timedelta(hours=2)
        self.banner.event_end = now + timedelta(hours=4)
        self.banner.save()
        data = ProductSerializer(self.product).data
        self.assertEqual(data["active_discount"], 0)

    def test_active_discount_zero_after_event_ends(self):
        """active_discount should be 0 if now is past event_end."""
        now = timezone.now()
        self.banner.event_start = now - timedelta(hours=4)
        self.banner.event_end = now - timedelta(hours=2)
        self.banner.save()
        data = ProductSerializer(self.product).data
        self.assertEqual(data["active_discount"], 0)

    def test_active_discount_zero_when_banner_inactive(self):
        """active_discount should be 0 when is_active is False, even within the time window."""
        self.banner.is_active = False
        self.banner.save()
        data = ProductSerializer(self.product).data
        self.assertEqual(data["active_discount"], 0)

    def test_active_discount_zero_with_no_banner(self):
        """active_discount should be 0 for products with no linked offer banner."""
        product = make_product(self.category, name="No Banner Product", discount_percentage=10)
        data = ProductSerializer(product).data
        self.assertEqual(data["active_discount"], 0)
        self.assertIsNone(data["discounted_price"])


# 2. Cart endpoints

class CartTests(APITestCase):
    """Tests for /api/cart/add/ and /api/cart/update/."""

    def setUp(self):
        self.user = User.objects.create_user(username="cartuser", password="pass123")
        self.client.force_authenticate(user=self.user)
        self.category = make_category()
        self.product = make_product(self.category)

    # --- add to cart ---

    def test_add_to_cart_success(self):
        """A valid product_id should add the item and return cart_count of 1."""
        res = self.client.post("/api/cart/add/", {"product_id": self.product.id})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["cart_count"], 1)

    def test_add_to_cart_duplicate_increments_quantity(self):
        """Adding the same product twice should increment quantity, not create a second row."""
        self.client.post("/api/cart/add/", {"product_id": self.product.id})
        self.client.post("/api/cart/add/", {"product_id": self.product.id})
        cart = Cart.objects.get(user=self.user)
        item = CartItem.objects.get(cart=cart, product=self.product)
        self.assertEqual(item.quantity, 2)

    def test_add_to_cart_nonexistent_product_returns_404(self):
        """A product_id that does not exist should return 404, not a 500."""
        res = self.client.post("/api/cart/add/", {"product_id": 99999})
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_add_to_cart_missing_product_id_returns_400(self):
        """Omitting product_id entirely should return 400."""
        res = self.client.post("/api/cart/add/", {})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_add_to_cart_malformed_product_id_returns_404(self):
        """A non-numeric product_id should return 404, not a ValueError 500."""
        res = self.client.post("/api/cart/add/", {"product_id": "not-a-number"})
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_add_to_cart_requires_auth(self):
        """Unauthenticated requests should be rejected with 401."""
        self.client.force_authenticate(user=None)
        res = self.client.post("/api/cart/add/", {"product_id": self.product.id})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- update quantity ---

    def _add_and_get_item(self):
        """Helper: adds the test product to cart and returns the CartItem."""
        self.client.post("/api/cart/add/", {"product_id": self.product.id})
        cart = Cart.objects.get(user=self.user)
        return CartItem.objects.get(cart=cart, product=self.product)

    def test_update_quantity_success(self):
        """Setting a valid quantity should persist and return the updated item."""
        item = self._add_and_get_item()
        res = self.client.post("/api/cart/update/", {"item_id": item.id, "quantity": 5})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        item.refresh_from_db()
        self.assertEqual(item.quantity, 5)

    def test_update_quantity_to_zero_removes_item(self):
        """Quantity of 0 (or less) should delete the cart item."""
        item = self._add_and_get_item()
        res = self.client.post("/api/cart/update/", {"item_id": item.id, "quantity": 0})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(CartItem.objects.filter(id=item.id).exists())

    def test_update_invalid_quantity_returns_400(self):
        """A non-numeric quantity should return 400, not a TypeError 500."""
        item = self._add_and_get_item()
        res = self.client.post("/api/cart/update/", {"item_id": item.id, "quantity": "lots"})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_nonexistent_item_returns_404(self):
        """An item_id that does not belong to the user's cart should return 404."""
        res = self.client.post("/api/cart/update/", {"item_id": 99999, "quantity": 1})
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


# 3. Order creation

class OrderTests(APITestCase):
    """Tests for /api/orders/create/."""

    def setUp(self):
        self.user = User.objects.create_user(username="orderuser", password="pass123")
        self.client.force_authenticate(user=self.user)
        category = make_category()
        self.product = make_product(category, price="30.00")
        cart = Cart.objects.create(user=self.user)
        CartItem.objects.create(cart=cart, product=self.product, quantity=2)
