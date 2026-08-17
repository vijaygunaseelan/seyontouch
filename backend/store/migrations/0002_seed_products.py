from django.db import migrations

from store.seed_data import SEED_PRODUCTS


def seed_products(apps, schema_editor):
    Product = apps.get_model("store", "Product")
    if Product.objects.exists():
        return
    Product.objects.bulk_create([Product(**p) for p in SEED_PRODUCTS])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("store", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_products, noop),
    ]
