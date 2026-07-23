from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Cart, CartItem, Category, Order, Product, UserProfile
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


class AuthTests(APITestCase):
    """Tests for handled JWT login responses."""

    def setUp(self):
        User.objects.create_user(username="loginuser", password="pass123")

    def test_login_success_returns_tokens(self):
        res = self.client.post(
            "/api/token/",
            {"username": "loginuser", "password": "pass123"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data["success"])
        self.assertIn("access", res.data)
        self.assertIn("refresh", res.data)

    def test_login_invalid_credentials_returns_handled_response(self):
        res = self.client.post(
            "/api/token/",
            {"username": "loginuser", "password": "wrong"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(res.data["success"])
        self.assertEqual(res.data["detail"], "Invalid username or password.")

    def test_check_username_available(self):
        res = self.client.get("/api/register/check-username/?username=newuser")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data["available"])

    def test_check_username_taken_is_case_insensitive(self):
        res = self.client.get("/api/register/check-username/?username=LoginUser")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(res.data["available"])
        self.assertEqual(res.data["message"], "This username is already taken.")

    def test_check_username_requires_username(self):
        res = self.client.get("/api/register/check-username/")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(res.data["available"])

    def test_check_username_rejects_spaces(self):
        res = self.client.get("/api/register/check-username/?username=new%20user")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(res.data["available"])
        self.assertEqual(res.data["message"], "Username cannot contain spaces.")

    def test_register_rejects_username_with_spaces(self):
        res = self.client.post(
            "/api/register/",
            {
                "username": "new user",
                "email": "new@example.com",
                "password": "pass12345",
                "password2": "pass12345",
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", res.data)


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

    def test_created_order_keeps_delivery_details_and_sale_price(self):
        self.product.discount_percentage = 25
        self.product.save(update_fields=["discount_percentage"])

        res = self.client.post(
            "/api/orders/create/",
            {
                "name": "Test User",
                "address": "Road 1",
                "phone": "+8801700000000",
                "payment_method": "COD",
            },
            format="json",
        )

        order = Order.objects.get(pk=res.data["order_id"])
        self.assertEqual(order.recipient_name, "Test User")
        self.assertEqual(order.delivery_address, "Road 1")
        self.assertEqual(order.status, Order.STATUS_PLACED)
        self.assertEqual(str(order.total_amount), "45.00")
        self.assertEqual(str(order.items.get().price), "22.50")

    def test_order_history_only_returns_authenticated_users_orders(self):
        self.client.post(
            "/api/orders/create/",
            {"name": "Test User", "address": "Road 1", "phone": "01700000000"},
            format="json",
        )
        another_user = User.objects.create_user(username="someoneelse", password="pass123")
        Order.objects.create(user=another_user, total_amount="10.00")

        res = self.client.get("/api/orders/")

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["recipient_name"], "Test User")

    def test_cannot_open_another_users_order(self):
        another_user = User.objects.create_user(username="someoneelse", password="pass123")
        other_order = Order.objects.create(user=another_user, total_amount="10.00")

        res = self.client.get(f"/api/orders/{other_order.id}/")

        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


class ProfileTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="profileuser",
            email="old@example.com",
            password="pass12345",
        )
        self.client.force_authenticate(user=self.user)

    def test_profile_is_initialized_for_existing_user(self):
        self.assertFalse(UserProfile.objects.filter(user=self.user).exists())

        res = self.client.get("/api/profile/")

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["username"], "profileuser")
        self.assertEqual(res.data["phone"], "")
        self.assertEqual(res.data["address"], "")
        self.assertTrue(UserProfile.objects.filter(user=self.user).exists())

    def test_profile_update_changes_user_and_profile_fields(self):
        res = self.client.patch(
            "/api/profile/",
            {
                "username": "newprofileuser",
                "name": "Profile User",
                "email": "new@example.com",
                "phone": "01700000000",
                "address": "Dhaka",
            },
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        profile = UserProfile.objects.get(user=self.user)
        self.assertEqual(self.user.username, "newprofileuser")
        self.assertEqual(self.user.email, "new@example.com")
        self.assertEqual(profile.full_name, "Profile User")
        self.assertEqual(profile.phone, "01700000000")

    def test_profile_update_rejects_taken_username_case_insensitively(self):
        User.objects.create_user(username="AlreadyTaken", password="pass12345")

        res = self.client.patch(
            "/api/profile/",
            {"username": "alreadytaken"},
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", res.data)

    def test_password_change_checks_current_password(self):
        res = self.client.post(
            "/api/profile/password/",
            {
                "current_password": "wrong",
                "new_password": "Newsecurepass456!",
                "confirm_password": "Newsecurepass456!",
            },
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("current_password", res.data)

    def test_password_change_success(self):
        res = self.client.post(
            "/api/profile/password/",
            {
                "current_password": "pass12345",
                "new_password": "Newsecurepass456!",
                "confirm_password": "Newsecurepass456!",
            },
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("Newsecurepass456!"))

    def test_delete_account_requires_explicit_confirmation(self):
        res = self.client.delete(
            "/api/profile/delete/",
            {"password": "pass12345", "confirmation": "delete"},
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(User.objects.filter(pk=self.user.pk).exists())

    def test_delete_account_cascades_profile_cart_and_orders(self):
        profile = UserProfile.objects.create(user=self.user, full_name="Profile User")
        category = make_category()
        product = make_product(category)
        cart = Cart.objects.create(user=self.user)
        CartItem.objects.create(cart=cart, product=product)
        order = Order.objects.create(user=self.user, total_amount="100.00")

        res = self.client.delete(
            "/api/profile/delete/",
            {"password": "pass12345", "confirmation": "DELETE"},
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(pk=self.user.pk).exists())
        self.assertFalse(UserProfile.objects.filter(pk=profile.pk).exists())
        self.assertFalse(Cart.objects.filter(pk=cart.pk).exists())
        self.assertFalse(Order.objects.filter(pk=order.pk).exists())
