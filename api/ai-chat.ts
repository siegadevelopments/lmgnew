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
    let productsQuery = supabase.from('products').select('id, title, price, slug').eq('status', 'published');

    if (vendor_id) {
      const { data: vendor } = await supabase.from('vendor_profiles').select('store_name').eq('id', vendor_id).single();
      if (vendor) {
        contextName = vendor.store_name;
        productsQuery = productsQuery.eq('vendor_id', vendor_id);
      }
    }

    const { data: allArticles } = await supabase.from('articles').select('id, title, slug').limit(100);
    const { data: allProducts } = await productsQuery.limit(100);

    // 1. ADVANCED KEYWORD ENGINE
    const STOP_WORDS = new Set(['can', 'you', 'me', 'tell', 'about', 'the', 'and', 'for', 'with', 'your', 'this', 'that', 'have', 'from', 'some', 'what', 'there', 'here', 'when', 'where', 'how', 'who', 'why']);
    
    const queryWords = lowerContent.split(/\s+/)
      .map(w => w.replace(/[^a-z0-9]/g, ''))
      .filter(w => w.length > 2 && !STOP_WORDS.has(w));

    if (queryWords.length === 0) {
      return res.status(200).json({ response: `Hello! I'm your wellness assistant for ${contextName}. How can I help you find specific products or wellness articles today?` });
    }

    // 2. WHOLE-WORD MATCHING
    const findMatches = (list: any[]) => {
      return (list || []).filter(item => {
        const text = (item.title + ' ' + (item.slug || '')).toLowerCase();
        return queryWords.some(word => {
          const regex = new RegExp(`\\b${word}\\b`, 'i');
          return regex.test(text);
        });
      });
    };

    const articleMatches = findMatches(allArticles || []).slice(0, 3);
    const productMatches = findMatches(allProducts || []).slice(0, 3);

    // 3. SYNTHESIS
    let responseText = "";

    if (articleMatches.length > 0 || productMatches.length > 0) {
      const mainTopic = queryWords[0].charAt(0).toUpperCase() + queryWords[0].slice(1);
      responseText = `I've found some relevant information regarding **${mainTopic}** for you:`;

      if (articleMatches.length > 0) {
        responseText += `\n\n**Helpful Articles:**` + articleMatches.map(a => `\n- 📖 [**${a.title}**](/articles/${a.slug})`).join("");
      }

      if (productMatches.length > 0) {
        responseText += `\n\n**Recommended Products from ${contextName}:**` + productMatches.map(p => `\n- **[PRODUCT:${p.id}]**`).join("");
      }
      
      responseText += `\n\nIs there anything else you'd like to know about this?`;
    } else {
      responseText = `I couldn't find any specific articles or products for "**${queryWords.join(' ')}**" at ${contextName} right now. \n\nFeel free to try different keywords or browse our **[Explore](/shop)** section!`;
    }

    return res.status(200).json({ response: responseText });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
