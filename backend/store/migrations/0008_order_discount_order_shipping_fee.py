from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0007_product_cost_price'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='discount',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='order',
            name='shipping_fee',
            field=models.PositiveIntegerField(default=0),
        ),
    ]
