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

    // 1. Context Awareness (Vendor vs Global)
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

    const { data: allProducts } = await productsQuery.limit(50);

    // 2. Semantic Keyword Engine
    const words = lowerContent.split(/\s+/).filter(w => w.length > 2);
    const matches = (allProducts || []).filter(p => {
      const titleLower = p.title.toLowerCase();
      return words.some(word => titleLower.includes(word)) || 
             (vendor_id ? false : words.some(word => p.slug?.includes(word)));
    }).slice(0, 3);

    // 3. Response Generation (Persona-Based)
    let responseText = "";

    if (matches.length > 0) {
      const productList = matches.map(p => `**[PRODUCT:${p.id}]**`).join(", ");
      if (/\b(how much|price|cost|\$)\b/.test(lowerContent)) {
        const p = matches[0];
        responseText = `The **[PRODUCT:${p.id}]** is currently available for $${p.price}. Would you like to see more details?`;
      } else {
        responseText = `Based on your request, I highly recommend checking out ${productList} from ${contextName}. They are some of our most popular wellness items!`;
      }
    } else if (/\b(hello|hi|hey|greet)\b/.test(lowerContent)) {
      responseText = `Hello! I'm your wellness assistant for ${contextName}. How can I help you find the perfect natural products today?`;
    } else if (/\b(delivery|shipping|time|long)\b/.test(lowerContent)) {
      responseText = `Shipping times vary by location, but most orders from ${contextName} are processed within 2-3 business days.`;
    } else {
      responseText = `I'd love to help you find something at ${contextName}! Could you tell me more about what you're looking for? You can ask about prices, recommendations, or specific wellness goals.`;
    }

    return res.status(200).json({ response: responseText });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
