from django.db import migrations, models
from django.db.models import Avg, Count


def populate_rating_summaries(apps, schema_editor):
    Product = apps.get_model('store', 'Product')
    Review = apps.get_model('store', 'Review')
    database = schema_editor.connection.alias

    summaries = (
        Review.objects.using(database)
        .values('product_id')
        .annotate(average=Avg('rating'), count=Count('id'))
    )
    for summary in summaries.iterator():
        Product.objects.using(database).filter(
            pk=summary['product_id'],
        ).update(
            average_rating=summary['average'],
            review_count=summary['count'],
        )


class Migration(migrations.Migration):
    dependencies = [
        ('store', '0016_review_reviewimage'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='average_rating',
            field=models.DecimalField(
                decimal_places=2,
                default=0,
                editable=False,
                max_digits=3,
            ),
        ),
        migrations.AddField(
            model_name='product',
            name='review_count',
            field=models.PositiveIntegerField(default=0, editable=False),
        ),
        migrations.AddIndex(
            model_name='product',
            index=models.Index(
                fields=['category', '-is_featured', '-created_at'],
                name='store_prod_cat_feat_new_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='product',
            index=models.Index(
                fields=['-discount_percentage', '-created_at'],
                name='store_prod_sale_new_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='product',
            index=models.Index(
                fields=['is_hot', '-created_at'],
                name='store_prod_hot_new_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='product',
            index=models.Index(
                fields=['is_weekly_top', '-created_at'],
                name='store_prod_week_new_idx',
            ),
        ),
        migrations.RunPython(
            populate_rating_summaries,
            reverse_code=migrations.RunPython.noop,
        ),
    ]
