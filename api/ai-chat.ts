import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { content, vendor_id } = req.body;
    const lowerContent = content.toLowerCase();

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    let contextName = "the Marketplace";
    let instructions = "Be a helpful wellness guide. Recommend products naturally.";
    let productsQuery = supabase.from('products').select('id, title, price, slug, image_url').eq('status', 'published');

    // 1. Context Awareness
    if (vendor_id) {
      const { data: vendor } = await supabase
        .from('vendor_profiles')
        .select('store_name, ai_instructions')
        .eq('id', vendor_id)
        .single();
      if (vendor) {
        contextName = vendor.store_name;
        instructions = vendor.ai_instructions || instructions;
        productsQuery = productsQuery.eq('vendor_id', vendor_id);
      }
    }

    // 2. Fetch Data
    const { data: allArticles } = await supabase.from('articles').select('id, title, slug').limit(100);
    const { data: allProducts } = await productsQuery.limit(100);

    // 3. Keyword Matching
    const words = lowerContent.split(/\s+/).filter((w: string) => w.length > 2);
    
    const productMatches = (allProducts || []).filter((p: any) => {
      const titleLower = p.title.toLowerCase();
      return words.some((word: string) => {
        const stem = word.endsWith('s') ? word.slice(0, -1) : word;
        return titleLower.includes(stem);
      });
    }).slice(0, 3);

    const articleMatches = (allArticles || []).filter((a: any) => {
      const titleLower = a.title.toLowerCase();
      return words.some((word: string) => {
        const stem = word.endsWith('s') ? word.slice(0, -1) : word;
        return titleLower.includes(stem);
      });
    }).slice(0, 2);

    // 4. Smart Response Building
    let responseText = "";

    if (articleMatches.length > 0 || productMatches.length > 0) {
      if (articleMatches.length > 0) {
        const articleLinks = articleMatches.map(a => `\n- 📖 Read more: [**${a.title}**](/articles/${a.slug})`).join("");
        responseText += `I found some helpful reading for you on this topic:${articleLinks}\n`;
      }

      if (productMatches.length > 0) {
        const productList = productMatches.map(p => `**[PRODUCT:${p.id}]**`).join(", ");
        if (responseText) {
          responseText += `\nRecommended items from ${contextName}: ${productList}`;
        } else {
          responseText = `I recommend checking out these items from ${contextName}: ${productList}`;
        }
      }
    } else if (/\b(hello|hi|hey|greet)\b/.test(lowerContent)) {
      responseText = `Hello! I'm your wellness guide for ${contextName}. I can help you find products or relevant health articles. What's on your mind today?`;
    } else {
      responseText = `I'd love to help you find information or products at ${contextName}! Could you tell me more about what you're looking for (e.g., "asthma tips" or "skin care")?`;
    }

    return res.status(200).json({ response: responseText });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
