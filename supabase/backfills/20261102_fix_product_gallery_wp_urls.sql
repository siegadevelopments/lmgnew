-- ============================================================
-- Migration: fix broken wp-content image URLs in products.images
--
-- 110 gallery URLs on 94 products point at lifestylemedicinegateway.com/wp-content/uploads/...
-- (the old WordPress site). A Vercel firewall rule now denies that path, so they all 403.
--   * 90 of them exist on Cloudflare R2 under " (1).uploads/", so they are rewritten to the R2 URL.
--   * 20 (Noosa Nude product photos and a few cleaner shots) exist nowhere: not on R2 and not in the
--     Supabase Storage archive. Each of those 12 products still has a working main image_url, so the
--     dead entries are removed from the gallery (4 of them end with an empty gallery).
-- The storefront does not read products.images today, so this is data hygiene, not a visible change.
--
-- Run in the SQL Editor. Safe to run more than once: after the first run nothing matches.
-- Check afterwards:
--   select count(*) from products, unnest(images) u where u like '%wp-content/uploads/%';   -- expect 0
-- ============================================================

BEGIN;

WITH map(old_url, new_url) AS (
  VALUES
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2024/08/Main-Profile-Pic-scaled.jpg', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2024/08/Main-Profile-Pic-scaled.jpg'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2024/08/Reiki-2-scaled.jpg', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2024/08/Reiki-2-scaled.jpg'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2024/08/Reiki-scaled.jpg', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2024/08/Reiki-scaled.jpg'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2024/08/white-lotus-scaled.jpg', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2024/08/white-lotus-scaled.jpg'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2025/12/2026-Calendar-scaled.jpg', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2025/12/2026-Calendar-scaled.jpg'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2025/12/AtHomefacial_f91c8cde-f8fa-4bee-9542-32184c1de3e9.webp', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2025/12/AtHomefacial_f91c8cde-f8fa-4bee-9542-32184c1de3e9.webp'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2025/12/Brighten_Firm_be6acc87-1d18-4d9e-b18d-5b13e42f1614.webp', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2025/12/Brighten_Firm_be6acc87-1d18-4d9e-b18d-5b13e42f1614.webp'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/01/Bi_cab_paste_Laguna_Lookout_Square.webp', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/01/Bi_cab_paste_Laguna_Lookout_Square.webp'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/01/Floor_Cleaner_Lemon_Myrtle_Noosa_Main_Beach_Square.webp', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/01/Floor_Cleaner_Lemon_Myrtle_Noosa_Main_Beach_Square.webp'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/01/Intro_Pack_Square_crop.webp', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/01/Intro_Pack_Square_crop.webp'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/01/Lemon_air_freshner_Noosa_National_Park_walk_Square.webp', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/01/Lemon_air_freshner_Noosa_National_Park_walk_Square.webp'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/01/Rose_Serenity_Air_Freshener_Noosa_Everglades_Square.webp', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/01/Rose_Serenity_Air_Freshener_Noosa_Everglades_Square.webp'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/01/Toilet_Cleaner_Kondalia_Square.webp', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/01/Toilet_Cleaner_Kondalia_Square.webp'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/01/Zesty_Rose_Air_freshner_Australia_Zoo_Square.webp', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/01/Zesty_Rose_Air_freshner_Australia_Zoo_Square.webp'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/01/clots.webp', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/01/clots.webp'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/03/Dishwashing-Liquid-Lemon-Lime-500ml.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/03/Dishwashing-Liquid-Lemon-Lime-500ml.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/03/Fabric-Softener-Tasmanian-Lavender-1L.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/03/Fabric-Softener-Tasmanian-Lavender-1L.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/03/Laundry-Liquid-Tasmanian-Lavender-1L.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/03/Laundry-Liquid-Tasmanian-Lavender-1L.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/03/Mould-Mildew-Cleaner-Pine-Needle-Clove-20kg-.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/03/Mould-Mildew-Cleaner-Pine-Needle-Clove-20kg-.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/03/Mould-Mildew-Cleaner-Pine-Needle-Clove-500ml-1.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/03/Mould-Mildew-Cleaner-Pine-Needle-Clove-500ml-1.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/03/Multi-Purpose-Spray-Lavender-Tea-Tree-20kg.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/03/Multi-Purpose-Spray-Lavender-Tea-Tree-20kg.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/03/Multi-Purpose-Spray-Lavender-Tea-Tree-5kg.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/03/Multi-Purpose-Spray-Lavender-Tea-Tree-5kg.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/03/cropped-Bath-Shower-Gel-Lemon-Eucalyptus-500ml-1.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/03/cropped-Bath-Shower-Gel-Lemon-Eucalyptus-500ml-1.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/03/cropped-Mould-Mildew-Cleaner-Pine-Needle-Clove-5kg.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/03/cropped-Mould-Mildew-Cleaner-Pine-Needle-Clove-5kg.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/06112475-0af8-4f06-81e8-5620cdeba041-Photoroom.jpg', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/06112475-0af8-4f06-81e8-5620cdeba041-Photoroom.jpg'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/923529b3-10db-40f7-a694-96a2e17a42f2-Photoroom.jpg', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/923529b3-10db-40f7-a694-96a2e17a42f2-Photoroom.jpg'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Benzoin-Copal-3.jpg', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Benzoin-Copal-3.jpg'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Benzoin-Copal.jpg', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Benzoin-Copal.jpg'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Celtic-Sea-Salt-Coarse.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Celtic-Sea-Salt-Coarse.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Celtic-Sea-Salt-Fine.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Celtic-Sea-Salt-Fine.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Copal-3.jpg', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Copal-3.jpg'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Copal.jpg', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Copal.jpg'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Himalayan-Salt-Coarse.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Himalayan-Salt-Coarse.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Himalayan-Salt-Fine.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Himalayan-Salt-Fine.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Multi-Purpose-Spray-Lavender-Tea-Tree-500ml-1.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Multi-Purpose-Spray-Lavender-Tea-Tree-500ml-1.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Multi-Purpose-Spray-Lemon-Myrtle-20kg-1.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Multi-Purpose-Spray-Lemon-Myrtle-20kg-1.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Multi-Purpose-Spray-Lemon-Myrtle-250ml.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Multi-Purpose-Spray-Lemon-Myrtle-250ml.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Multi-Purpose-Spray-Lemon-Myrtle-500ml.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Multi-Purpose-Spray-Lemon-Myrtle-500ml.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Multi-Purpose-Spray-Lemon-Myrtle-5kg-1.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Multi-Purpose-Spray-Lemon-Myrtle-5kg-1.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Myrrh-Sandal-3.jpg', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Myrrh-Sandal-3.jpg'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Myrrh-Sandal.jpg', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Myrrh-Sandal.jpg'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Nag-Champa-2.jpg', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Nag-Champa-2.jpg'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Nag-Champa.jpg', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Nag-Champa.jpg'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Organic-Cashew-Butter.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Organic-Cashew-Butter.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Organic-Peanut-Butter-Crunchy-10kg.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Organic-Peanut-Butter-Crunchy-10kg.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Organic-Peanut-Butter-Crunchy-1kg.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Organic-Peanut-Butter-Crunchy-1kg.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Organic-Peanut-Butter-Crunchy-2kg.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Organic-Peanut-Butter-Crunchy-2kg.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Organic-Peanut-Butter-Crunchy-5kg.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Organic-Peanut-Butter-Crunchy-5kg.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Organic-Peanut-Butter-Crunchy.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Organic-Peanut-Butter-Crunchy.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Organic-Peanut-Butter-Paste-Chilli-Lime-Flavour.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Organic-Peanut-Butter-Paste-Chilli-Lime-Flavour.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Organic-Peanut-Butter-Paste-Ginger-Lime-Flavour.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Organic-Peanut-Butter-Paste-Ginger-Lime-Flavour.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Organic-Peanut-Butter-Paste-HOT-Chilli-Flavour.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Organic-Peanut-Butter-Paste-HOT-Chilli-Flavour.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Organic-Peanut-Butter-Paste-Manuka-Honey-Bee-Pollen.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Organic-Peanut-Butter-Paste-Manuka-Honey-Bee-Pollen.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Organic-Peanut-Butter-Paste-Peanut-Banana-Flavour.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Organic-Peanut-Butter-Paste-Peanut-Banana-Flavour.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Organic-Peanut-Butter-Smooth.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Organic-Peanut-Butter-Smooth.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Oud-Elan-Photoroom.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Oud-Elan-Photoroom.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Palo-Santo-3.jpg', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Palo-Santo-3.jpg'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Palo-Santo.jpg', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Palo-Santo.jpg'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Pure-Sandalwood-1.jpg', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Pure-Sandalwood-1.jpg'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Room-Spray-Blue-Gum-250ml.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Room-Spray-Blue-Gum-250ml.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Room-Spray-Bush-Mint-250ml.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Room-Spray-Bush-Mint-250ml.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Room-Spray-Desert-Lime-250ml-1.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Room-Spray-Desert-Lime-250ml-1.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Room-Spray-Lavender-250ml-1.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Room-Spray-Lavender-250ml-1.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Room-Spray-Lemon-Myrtle-20kg-1.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Room-Spray-Lemon-Myrtle-20kg-1.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Room-Spray-Sweet-Orange-20kg.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Room-Spray-Sweet-Orange-20kg.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Room-Spray-Sweet-Orange-250ml.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Room-Spray-Sweet-Orange-250ml.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Room-Spray-Sweet-Orange-5kg-1.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Room-Spray-Sweet-Orange-5kg-1.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Super-Concentrate-Lemon-Myrtle-20kg.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Super-Concentrate-Lemon-Myrtle-20kg.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Super-Concentrate-Lemon-Myrtle-500ml.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Super-Concentrate-Lemon-Myrtle-500ml.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Super-Concentrate-Lemon-Myrtle-5kg.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Super-Concentrate-Lemon-Myrtle-5kg.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Tile-Floor-Cleaner-Lemon-Eucalyptus-1L.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Tile-Floor-Cleaner-Lemon-Eucalyptus-1L.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Tile-Floor-Cleaner-Lemon-Eucalyptus-20kg.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Tile-Floor-Cleaner-Lemon-Eucalyptus-20kg.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Tile-Floor-Cleaner-Lemon-Eucalyptus-5kg.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Tile-Floor-Cleaner-Lemon-Eucalyptus-5kg.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Toilet-Cleaner-Pine-Needle-20kg.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Toilet-Cleaner-Pine-Needle-20kg.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Toilet-Cleaner-Pine-Needle-500ml.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Toilet-Cleaner-Pine-Needle-500ml.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Toilet-Cleaner-Pine-Needle-5kg.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Toilet-Cleaner-Pine-Needle-5kg.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/White-Sage-3.jpg', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/White-Sage-3.jpg'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/White-Sage-Lavender-Purple-2.jpg', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/White-Sage-Lavender-Purple-2.jpg'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/White-Sage-Lavender.jpg', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/White-Sage-Lavender.jpg'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/White-Sage-Palo-Santo-3.jpg', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/White-Sage-Palo-Santo-3.jpg'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/White-Sage-Palo-Santo.jpg', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/White-Sage-Palo-Santo.jpg'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/White-Sage.jpg', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/White-Sage.jpg'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Wild-Yam-Cream.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Wild-Yam-Cream.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Window-Glass-Cleaner-Tasmanian-Lavender-20kg.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Window-Glass-Cleaner-Tasmanian-Lavender-20kg.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Window-Glass-Cleaner-Tasmanian-Lavender-500ml.png', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/Window-Glass-Cleaner-Tasmanian-Lavender-500ml.png'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/baeba931-d8f9-4f2e-9367-f75dfafa549a-Photoroom.jpg', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/baeba931-d8f9-4f2e-9367-f75dfafa549a-Photoroom.jpg'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/c644fe83-ecba-4f5c-9b72-7284be4a6e4e-Photoroom.jpg', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/c644fe83-ecba-4f5c-9b72-7284be4a6e4e-Photoroom.jpg'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/ce597a77-f526-492a-a549-187699240a96-Photoroom.jpg', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/ce597a77-f526-492a-a549-187699240a96-Photoroom.jpg'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/cf119ff8-ff81-4028-9366-043c5c212241-Photoroom.jpg', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/cf119ff8-ff81-4028-9366-043c5c212241-Photoroom.jpg'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/d437f673-8c16-4a87-be3d-751121a41f42-Photoroom.jpg', 'https://media.lifestylemedicinegateway.com/%20%281%29.uploads/2026/04/d437f673-8c16-4a87-be3d-751121a41f42-Photoroom.jpg'),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/01/250716_Noosa_Nude_Product_Air_Freshener_Lemon_Twist_8244.webp', NULL),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/01/250716_Noosa_Nude_Product_Air_Freshener_Lemon_Twist_8246.webp', NULL),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/01/250716_Noosa_Nude_Product_Air_Freshener_Rose_Serinity_8253.webp', NULL),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/01/250716_Noosa_Nude_Product_Air_Freshener_Rose_Serinity_8254.webp', NULL),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/01/250716_Noosa_Nude_Product_Air_Freshener_Zesty_Rose_8258.webp', NULL),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/01/250716_Noosa_Nude_Product_Air_Freshener_Zesty_Rose_8261.webp', NULL),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/01/250716_Noosa_Nude_Product_Bicarb_Cleaning_Paste_8264.webp', NULL),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/01/250716_Noosa_Nude_Product_Bicarb_Cleaning_Paste_8266.webp', NULL),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/01/250716_Noosa_Nude_Product_Bicarb_Cleaning_Paste_8268.webp', NULL),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/01/250716_Noosa_Nude_Product_Floor_Cleaner_8191.webp', NULL),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/01/250716_Noosa_Nude_Product_Floor_Cleaner_8194.webp', NULL),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/01/250716_Noosa_Nude_Product_Toliet_Cleaner_8204.webp', NULL),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/01/250716_Noosa_Nude_Product_Toliet_Cleaner_8207.webp', NULL),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/01/250830_Noosa_Nude_Boxes37133.webp', NULL),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/01/250830_Noosa_Nude_Boxes37134.webp', NULL),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/01/250830_Noosa_Nude_Boxes_Introductory_Pack_37113.webp', NULL),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Window-Glass-Cleaner-Tasmanian-Lavender-5kg-.png', NULL),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Wool-Wash-Blue-Gum-Eucalyptus-1L.png', NULL),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Wool-Wash-Blue-Gum-Eucalyptus-20kg.png', NULL),
    ('https://lifestylemedicinegateway.com/wp-content/uploads/2026/04/Wool-Wash-Blue-Gum-Eucalyptus-5kg.png', NULL)
)
UPDATE public.products p
SET images = COALESCE((
  SELECT array_agg(COALESCE(m.new_url, t.u) ORDER BY t.ord)
  FROM unnest(p.images) WITH ORDINALITY AS t(u, ord)
  LEFT JOIN map m ON m.old_url = t.u
  WHERE NOT (m.old_url IS NOT NULL AND m.new_url IS NULL)
), '{}'::text[])
WHERE p.images && (SELECT array_agg(old_url) FROM map);

COMMIT;
