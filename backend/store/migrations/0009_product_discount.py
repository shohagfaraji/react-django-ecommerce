from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0008_offerbanner'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='discount_percentage',
            field=models.PositiveSmallIntegerField(
                default=0,
                help_text='Discount % for this product (0 = no discount). Active only during linked offer banner period.'
            ),
        ),
        migrations.AddField(
            model_name='product',
            name='offer_banner',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='products',
                to='store.offerbanner',
                help_text='Link to the offer banner whose show_from/event_end controls when this discount is visible.'
            ),
        ),
    ]