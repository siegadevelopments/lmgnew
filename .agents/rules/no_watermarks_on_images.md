# Image Generation & Watermark Rules

## Core Rule
> [!IMPORTANT]
> **NO WATERMARKS OR LOGO OVERLAYS ON GENERATED IMAGES**:
> Whenever generating images for recipes, articles, videos, or social media content, **NEVER** apply watermarks, vendor logos, text boxes, or author attribution overlays on the generated image.

---

## Guidelines for Image Generation

1. **Clean Photorealistic Renders**:
   - All AI-generated images must be clean, high-definition, uncropped, and free of logos, stamps, watermarks, text banners, or visual labels.
   - Set `no_watermark: true` by default in all AI image generation invocations (`supabase.functions.invoke("generate-ai-image")`).

2. **Recipe Images Specifics**:
   - Recipe images must focus strictly on the food dish and fresh ingredients in a natural editorial setting.
   - Do NOT composite vendor/author logos or square branding boxes onto recipe photos.
