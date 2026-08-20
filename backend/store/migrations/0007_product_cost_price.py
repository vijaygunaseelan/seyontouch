# backend/store/migrations/0007_product_cost_price.py
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0006_delete_adminotp'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='cost_price',
            field=models.PositiveIntegerField(default=0),
        ),
    ]