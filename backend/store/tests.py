from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Cart, CartItem, Category, Product
from .serializers import ProductSerializer


def make_category(name="Test Electronics", slug="test-electronics"):
    return Category.objects.create(name=name, slug=slug)


def make_product(category, name="Test Product", price="100.00", **kwargs):
    return Product.objects.create(category=category, name=name, price=price, **kwargs)


class ProductDiscountTests(TestCase):
    """Tests for product-level discount serialization."""

    def setUp(self):
        self.category = make_category()
        self.product = make_product(
            self.category,
            price="1000.00",
            discount_percentage=20,
        )

    def test_active_discount_uses_product_discount_percentage(self):
        data = ProductSerializer(self.product).data
        self.assertEqual(data["active_discount"], 20)

    def test_discounted_price_is_correct(self):
        data = ProductSerializer(self.product).data
        self.assertEqual(data["discounted_price"], "800.00")

    def test_active_discount_zero_without_discount(self):
        product = make_product(
            self.category,
            name="No Discount Product",
            discount_percentage=0,
        )
        data = ProductSerializer(product).data
        self.assertEqual(data["active_discount"], 0)
        self.assertIsNone(data["discounted_price"])


class CartTests(APITestCase):
    """Tests for /api/cart/add/ and /api/cart/update/."""

    def setUp(self):
        self.user = User.objects.create_user(username="cartuser", password="pass123")
        self.client.force_authenticate(user=self.user)
        self.category = make_category()
        self.product = make_product(self.category)

    def test_add_to_cart_success(self):
        res = self.client.post("/api/cart/add/", {"product_id": self.product.id})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["cart_count"], 1)

    def test_add_to_cart_duplicate_increments_quantity(self):
        self.client.post("/api/cart/add/", {"product_id": self.product.id})
        self.client.post("/api/cart/add/", {"product_id": self.product.id})
        cart = Cart.objects.get(user=self.user)
        item = CartItem.objects.get(cart=cart, product=self.product)
        self.assertEqual(item.quantity, 2)

    def test_add_to_cart_nonexistent_product_returns_404(self):
        res = self.client.post("/api/cart/add/", {"product_id": 99999})
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_add_to_cart_missing_product_id_returns_400(self):
        res = self.client.post("/api/cart/add/", {})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_add_to_cart_requires_auth(self):
        self.client.force_authenticate(user=None)
        res = self.client.post("/api/cart/add/", {"product_id": self.product.id})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def _add_and_get_item(self):
        self.client.post("/api/cart/add/", {"product_id": self.product.id})
        cart = Cart.objects.get(user=self.user)
        return CartItem.objects.get(cart=cart, product=self.product)

    def test_update_quantity_success(self):
        item = self._add_and_get_item()
        res = self.client.post("/api/cart/update/", {"item_id": item.id, "quantity": 5})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        item.refresh_from_db()
        self.assertEqual(item.quantity, 5)

    def test_update_quantity_to_zero_removes_item(self):
        item = self._add_and_get_item()
        res = self.client.post("/api/cart/update/", {"item_id": item.id, "quantity": 0})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(CartItem.objects.filter(id=item.id).exists())

    def test_update_invalid_quantity_returns_400(self):
        item = self._add_and_get_item()
        res = self.client.post("/api/cart/update/", {"item_id": item.id, "quantity": "lots"})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_nonexistent_item_returns_404(self):
        res = self.client.post("/api/cart/update/", {"item_id": 99999, "quantity": 1})
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


class OrderTests(APITestCase):
    """Tests for /api/orders/create/."""

    def setUp(self):
        self.user = User.objects.create_user(username="orderuser", password="pass123")
        self.client.force_authenticate(user=self.user)
        category = make_category()
        self.product = make_product(category, price="30.00")
        cart = Cart.objects.create(user=self.user)
        CartItem.objects.create(cart=cart, product=self.product, quantity=2)

    def test_create_order_success(self):
        res = self.client.post(
            "/api/orders/create/",
            {"name": "Test User", "address": "Road 1", "phone": "01700000000"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn("order_id", res.data)

    def test_create_order_requires_phone(self):
        res = self.client.post(
            "/api/orders/create/",
            {"name": "Test User", "address": "Road 1", "phone": ""},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
