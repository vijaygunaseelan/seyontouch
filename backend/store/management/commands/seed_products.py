from django.core.management.base import BaseCommand
from django.db import transaction

from store.models import Product
from store.seed_data import SEED_PRODUCTS


class Command(BaseCommand):
    help = "Wipes the product catalog and reloads the demo seed data (same as the admin panel's 'Reset catalog' button)."

    def handle(self, *args, **options):
        with transaction.atomic():
            Product.objects.all().delete()
            Product.objects.bulk_create([Product(**p) for p in SEED_PRODUCTS])
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(SEED_PRODUCTS)} products."))
