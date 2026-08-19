from django.db import transaction
from django.db.models import Avg, Count
from django.db.models.signals import post_delete, post_save, pre_save
from django.dispatch import receiver

from .cache_utils import bump_store_cache_version
from .models import Product, Review


def refresh_product_rating(product_id):
    if not product_id:
        return

    with transaction.atomic():
        product = (
            Product.objects.select_for_update()
            .filter(pk=product_id)
            .first()
        )
        if not product:
            return

        summary = Review.objects.filter(product_id=product_id).aggregate(
            average=Avg('rating'),
            count=Count('id'),
        )
        Product.objects.filter(pk=product_id).update(
            average_rating=summary['average'] or 0,
            review_count=summary['count'],
        )


@receiver(pre_save, sender=Review)
def remember_previous_review_product(sender, instance, update_fields=None, **kwargs):
    if not instance.pk:
        instance._previous_product_id = None
        return

    if update_fields is not None and 'product' not in update_fields:
        instance._previous_product_id = instance.product_id
        return

    instance._previous_product_id = (
        sender.objects.filter(pk=instance.pk)
        .values_list('product_id', flat=True)
        .first()
    )


@receiver(post_save, sender=Review)
def update_rating_after_review_save(sender, instance, **kwargs):
    refresh_product_rating(instance.product_id)

    previous_product_id = getattr(instance, '_previous_product_id', None)
    if previous_product_id and previous_product_id != instance.product_id:
        refresh_product_rating(previous_product_id)

    transaction.on_commit(bump_store_cache_version)


@receiver(post_delete, sender=Review)
def update_rating_after_review_delete(sender, instance, **kwargs):
    refresh_product_rating(instance.product_id)
    transaction.on_commit(bump_store_cache_version)
