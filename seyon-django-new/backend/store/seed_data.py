# Mirrors the SEED_PRODUCTS array that used to live in the React app
# (src/App.jsx). Kept in one place so both the data migration and the
# admin "reset catalog" endpoint use the same source of truth.

SEED_PRODUCTS = [
    # Bangles
    dict(id="p_bangle01", name="Kada Bangles (Pair)", category="Bangles", listing_type="sale",
         price=899, stock=15, sku="GS-BNG-01", image="https://picsum.photos/seed/gsbangle1/500/500",
         description="Classic gold-tone kada bangles, sold as a pair, adjustable fit."),
    dict(id="p_bangle02", name="Meenakari Enamel Bangles", category="Bangles", listing_type="sale",
         price=649, stock=20, sku="GS-BNG-02", image="https://picsum.photos/seed/gsbangle2/500/500",
         description="Hand-painted meenakari enamel work, set of four bangles."),

    # Anti-Tarnish Chains
    dict(id="p_chain01", name="Anti-Tarnish Gold Chain", category="Anti-Tarnish Chains", listing_type="sale",
         price=1299, stock=18, sku="GS-CHN-01", image="https://picsum.photos/seed/gschain1/500/500",
         description="Waterproof, anti-tarnish plating that keeps its shine for years."),
    dict(id="p_chain02", name="Anti-Tarnish Layered Chain", category="Anti-Tarnish Chains", listing_type="sale",
         price=1599, stock=10, sku="GS-CHN-02", image="https://picsum.photos/seed/gschain2/500/500",
         description="Double-layered chain, tarnish-resistant coating, everyday wear."),

    # Anti-Tarnish Bracelets
    dict(id="p_bracelet01", name="Anti-Tarnish Cuban Bracelet", category="Anti-Tarnish Bracelets", listing_type="sale",
         price=799, stock=22, sku="GS-BRC-01", image="https://picsum.photos/seed/gsbracelet1/500/500",
         description="Chunky Cuban-link bracelet with a tarnish-proof finish."),
    dict(id="p_bracelet02", name="Anti-Tarnish Charm Bracelet", category="Anti-Tarnish Bracelets", listing_type="sale",
         price=949, stock=14, sku="GS-BRC-02", image="https://picsum.photos/seed/gsbracelet2/500/500",
         description="Delicate chain bracelet with mixed charms, safe for daily wear."),

    # Hair Accessories
    dict(id="p_hair01", name="Pearl Hair Pins (Set of 6)", category="Hair Accessories", listing_type="sale",
         price=349, stock=30, sku="GS-HAR-01", image="https://picsum.photos/seed/gshair1/500/500",
         description="Freshwater pearl hairpins, set of six, gold-tone base."),
    dict(id="p_hair02", name="Kundan Maang Tikka", category="Hair Accessories", listing_type="sale",
         price=599, stock=12, sku="GS-HAR-02", image="https://picsum.photos/seed/gshair2/500/500",
         description="Kundan-studded maang tikka with an adjustable chain."),

    # Designer Jewelry
    dict(id="p_designer01", name="Designer Statement Necklace", category="Designer Jewelry", listing_type="both",
         price=2999, rent_price=349, stock=6, sku="GS-DSG-01", image="https://picsum.photos/seed/gsdesigner1/500/500",
         description="Bold statement piece — buy to keep, or rent for a single event."),
    dict(id="p_designer02", name="Designer Cocktail Ring", category="Designer Jewelry", listing_type="sale",
         price=1199, stock=10, sku="GS-DSG-02", image="https://picsum.photos/seed/gsdesigner2/500/500",
         description="Oversized cocktail ring with a hand-set centre stone."),

    # Temple Jewels
    dict(id="p_temple01", name="Temple Jewelry Necklace Set", category="Temple Jewels", listing_type="rent",
         price=18999, rent_price=699, stock=3, sku="GS-TMP-01", image="https://picsum.photos/seed/gstemple1/500/500",
         description="Traditional temple-motif necklace with matching earrings, rental only."),
    dict(id="p_temple02", name="Temple Coin Necklace", category="Temple Jewels", listing_type="both",
         price=4599, rent_price=299, stock=5, sku="GS-TMP-02", image="https://picsum.photos/seed/gstemple2/500/500",
         description="Layered coin necklace in an antique gold finish."),

    # Chokers
    dict(id="p_choker01", name="Kundan Choker Set", category="Chokers", listing_type="both",
         price=3499, rent_price=299, stock=7, sku="GS-CHK-01", image="https://picsum.photos/seed/gschoker1/500/500",
         description="Kundan choker with drop earrings, ideal for festive occasions."),
    dict(id="p_choker02", name="Velvet Layered Choker", category="Chokers", listing_type="sale",
         price=899, stock=12, sku="GS-CHK-02", image="https://picsum.photos/seed/gschoker2/500/500",
         description="Velvet base choker with a delicate layered chain drop."),

    # Earings
    dict(id="p_earchain01", name="Gold Earings (Kaan Chain)", category="Earings", listing_type="sale",
         price=549, stock=20, sku="GS-EAR-01", image="https://picsum.photos/seed/gsearchain1/500/500",
         description="Delicate ear-to-hair chain that clips in without piercings."),
    dict(id="p_earchain02", name="Pearl Drop Earings", category="Earings", listing_type="sale",
         price=649, stock=16, sku="GS-EAR-02", image="https://picsum.photos/seed/gsearchain2/500/500",
         description="Pearl-drop Earings with a fine gold-tone connector."),
]
