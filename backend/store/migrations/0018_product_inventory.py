from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0017_product_rating_summary'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='low_stock_threshold',
            field=models.PositiveIntegerField(default=5),
        ),
        migrations.AddField(
            model_name='product',
            name='stock_quantity',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='product',
            name='track_inventory',
            field=models.BooleanField(
                default=False,
                help_text='Prevent orders from exceeding the available stock.',
            ),
        ),
        migrations.AddField(
            model_name='orderitem',
            name='stock_deducted',
            field=models.PositiveIntegerField(default=0, editable=False),
        ),
        migrations.AlterField(
            model_name='product',
            name='track_inventory',
            field=models.BooleanField(
                default=True,
                help_text='Prevent orders from exceeding the available stock.',
            ),
        ),
    ]

