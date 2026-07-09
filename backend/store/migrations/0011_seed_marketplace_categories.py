from django.db import migrations


MARKETPLACE_CATEGORIES = [
    (
        "Clothing",
        "clothing",
        "clothing",
        "Fashion for men, women, kids, shoes, and accessories.",
        [
            ("Men", "mens-clothing"),
            ("Women", "womens-clothing"),
            ("Kids", "kids-clothing"),
            ("Shoes", "shoes"),
            ("Bags & Accessories", "bags-accessories"),
        ],
    ),
    (
        "Electronics",
        "electronics",
        "electronics",
        "Phones, computers, gaming, storage, and accessories.",
        [
            ("Mobile Phones", "mobile-phones"),
            ("Desktop Computers", "desktop-computers"),
            ("Laptops", "laptops"),
            ("Tablets", "tablets"),
            ("Headphones", "headphones"),
            ("Keyboard", "keyboard"),
            ("Mouse", "mouse"),
            ("Hard Drives / SSD", "hard-drives-ssd"),
            ("Gaming Consoles", "gaming-consoles"),
            ("WiFi Routers", "wifi-routers"),
            ("Printers & Scanners", "printers-scanners"),
            ("Smart Watches", "smart-watches"),
            ("Cameras", "cameras"),
            ("Smart TVs", "smart-tvs"),
            ("Wires & Cables", "wires-cables"),
            ("Power Banks", "power-banks"),
            ("Chargers & Adapters", "chargers-adapters"),
            ("UPS / Inverters", "ups-inverters"),
            ("USB Drives", "usb-drives"),
            ("Network Switches", "network-switches"),
            ("LAN Cables", "lan-cables"),
            ("Security Cameras", "security-cameras"),
        ],
    ),
    (
        "Toys & Kids",
        "toys",
        "toys",
        "Baby items, learning toys, outdoor play, and gifts.",
        [
            ("Baby Toys", "baby-toys"),
            ("Learning Toys", "learning-toys"),
            ("Outdoor Play", "outdoor-play"),
            ("Kids Gifts", "kids-gifts"),
        ],
    ),
    (
        "Garden & Plants",
        "garden",
        "garden",
        "Indoor plants, planters, soil, and garden care.",
        [
            ("Indoor Plants", "indoor-plants"),
            ("Flowering Plants", "flowering-plants"),
            ("Plant Pots", "plant-pots"),
            ("Garden Tools", "garden-tools"),
        ],
    ),
    (
        "Home & Living",
        "home-living",
        "home",
        "Kitchen, decor, cleaning, and daily home essentials.",
        [
            ("Kitchen & Dining", "kitchen-dining"),
            ("Home Decor", "home-decor"),
            ("Cleaning Supplies", "cleaning-supplies"),
        ],
    ),
]


def seed_categories(apps, schema_editor):
    Category = apps.get_model("store", "Category")

    for index, (name, slug, section, description, children) in enumerate(MARKETPLACE_CATEGORIES):
        category, _ = Category.objects.update_or_create(
            slug=slug,
            defaults={
                "name": name,
                "section": section,
                "description": description,
                "parent": None,
                "is_active": True,
                "is_featured": index < 4,
                "sort_order": index,
            },
        )

        for child_index, (child_name, child_slug) in enumerate(children):
            Category.objects.update_or_create(
                slug=child_slug,
                defaults={
                    "name": child_name,
                    "section": section,
                    "description": "",
                    "parent": category,
                    "is_active": True,
                    "is_featured": False,
                    "sort_order": child_index,
                },
            )


def unseed_categories(apps, schema_editor):
    Category = apps.get_model("store", "Category")
    slugs = []
    for _, slug, _, _, children in MARKETPLACE_CATEGORIES:
        slugs.append(slug)
        slugs.extend(child_slug for _, child_slug in children)
    Category.objects.filter(slug__in=slugs).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("store", "0010_herobanner_alter_category_options_and_more"),
    ]

    operations = [
        migrations.RunPython(seed_categories, unseed_categories),
    ]
