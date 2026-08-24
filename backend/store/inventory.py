from collections import defaultdict

from django.db import connection, transaction

from .models import Order, OrderItem, Product


class InventoryError(Exception):
    pass


def stock_error_message(product, requested_quantity=1):
    if product.stock_quantity == 0:
        return f'{product.name} is currently out of stock.'
    unit_label = 'unit' if product.stock_quantity == 1 else 'units'
    return (
        f'Only {product.stock_quantity} {unit_label} of {product.name} are '
        f'available. You requested {requested_quantity}.'
    )


def validate_product_quantity(product, quantity):
    if product.track_inventory and quantity > product.stock_quantity:
        raise InventoryError(stock_error_message(product, quantity))


def reserve_cart_inventory(cart_items):
    if not connection.in_atomic_block:
        raise RuntimeError('Inventory reservations require a transaction.')

    product_ids = sorted({item.product_id for item in cart_items})
    products = {
        product.pk: product
        for product in Product.objects.select_for_update().filter(
            pk__in=product_ids,
        )
    }
    if len(products) != len(product_ids):
        raise InventoryError(
            'A product in your cart is no longer available.'
        )

    requested_quantities = defaultdict(int)
    for item in cart_items:
        requested_quantities[item.product_id] += item.quantity
    for product_id, quantity in requested_quantities.items():
        validate_product_quantity(products[product_id], quantity)

    changed_products = {}
    deductions = {}
    for item in cart_items:
        product = products[item.product_id]
        item.product = product
        if not product.track_inventory:
            deductions[item.pk] = 0
            continue
        product.stock_quantity -= item.quantity
        deductions[item.pk] = item.quantity
        changed_products[product.pk] = product

    if changed_products:
        Product.objects.bulk_update(
            changed_products.values(),
            ['stock_quantity'],
        )
    return deductions


def restore_order_inventory(order):
    if not connection.in_atomic_block:
        raise RuntimeError('Inventory restoration requires a transaction.')

    order_items = list(
        OrderItem.objects.select_for_update().filter(
            order=order,
            stock_deducted__gt=0,
        )
    )
    if not order_items:
        return False

    quantities = defaultdict(int)
    for item in order_items:
        quantities[item.product_id] += item.stock_deducted

    products = list(
        Product.objects.select_for_update().filter(
            pk__in=sorted(quantities),
        )
    )
    for product in products:
        product.stock_quantity += quantities[product.pk]

    Product.objects.bulk_update(products, ['stock_quantity'])
    OrderItem.objects.filter(
        pk__in=[item.pk for item in order_items],
    ).update(stock_deducted=0)
    return True


def change_order_status(order_id, next_status):
    with transaction.atomic():
        order = Order.objects.select_for_update().filter(pk=order_id).first()
        if not order:
            return None, False
        if order.status == Order.STATUS_CANCELLED:
            if next_status != Order.STATUS_CANCELLED:
                raise InventoryError('Cancelled orders cannot be reopened.')
            return order, False

        inventory_changed = False
        if next_status == Order.STATUS_CANCELLED:
            inventory_changed = restore_order_inventory(order)

        order.status = next_status
        order.save(update_fields=['status', 'updated_at'])
        return order, inventory_changed
