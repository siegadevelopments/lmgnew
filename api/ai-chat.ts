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
    let productsQuery = supabase.from('products').select('id, title, price, slug, excerpt').eq('status', 'published');

    if (vendor_id) {
      const { data: vendor } = await supabase.from('vendor_profiles').select('store_name').eq('id', vendor_id).single();
      if (vendor) {
        contextName = vendor.store_name;
        productsQuery = productsQuery.eq('vendor_id', vendor_id);
      }
    }

    const [articlesRes, productsRes, recipesRes] = await Promise.all([
      supabase.from('articles').select('id, title, slug, excerpt').limit(150),
      productsQuery.limit(150),
      supabase.from('recipes').select('id, title, slug, excerpt').limit(150)
    ]);

    const allArticles = articlesRes.data || [];
    const allProducts = productsRes.data || [];
    const allRecipes = recipesRes.data || [];

    const STOP_WORDS = new Set([
      'can', 'you', 'me', 'tell', 'about', 'the', 'and', 'for', 'with', 'your', 'this', 'that', 'have', 'from', 'some', 'what', 'there', 'here', 'when', 'where', 'how', 'who', 'why',
      'meant', 'mean', 'want', 'look', 'find', 'show', 'give', 'tell', 'need', 'help', 'search', 'find', 'think', 'thought', 'like', 'does', 'did', 'was', 'were', 'been', 'being',
      'information', 'info', 'products', 'product', 'items', 'item', 'articles', 'article', 'tips', 'tip', 'details', 'detail', 'guide', 'guides', 'website', 'site'
    ]);
    
    const queryWords = lowerContent.split(/\s+/)
      .map((w: string) => w.replace(/[^a-z0-9]/g, ''))
      .filter((w: string) => w.length > 2 && !STOP_WORDS.has(w));

    if (queryWords.length === 0) {
      return res.status(200).json({ response: `Hello! I'm your wellness guide for ${contextName}. How can I help you today?` });
    }

    const findMatches = (list: any[]) => {
      return list.map(item => {
        const text = (item.title + ' ' + (item.slug || '') + ' ' + (item.excerpt || '')).toLowerCase();
        let score = 0;
        queryWords.forEach((word: string) => {
          const regex = new RegExp(`\\b${word}\\b`, 'i');
          if (regex.test(text)) score += 2;
          else if (text.includes(word)) score += 1;
        });
        return { ...item, score };
      }).filter(item => item.score > 0).sort((a, b) => b.score - a.score);
    };

    const articleMatches = findMatches(allArticles).slice(0, 3);
    const productMatches = findMatches(allProducts).slice(0, 3);
    const recipeMatches = findMatches(allRecipes).slice(0, 3);

    let responseText = "";

    if (articleMatches.length > 0 || productMatches.length > 0 || recipeMatches.length > 0) {
      const bestWord = queryWords.reduce((prev: string, curr: string) => {
        const prevCount = [...articleMatches, ...productMatches, ...recipeMatches].filter(i => (i.title + (i.slug||'')).toLowerCase().includes(prev)).length;
        const currCount = [...articleMatches, ...productMatches, ...recipeMatches].filter(i => (i.title + (i.slug||'')).toLowerCase().includes(curr)).length;
        return currCount > prevCount ? curr : prev;
      }, queryWords[0]);

      const displayTopic = bestWord.charAt(0).toUpperCase() + bestWord.slice(1);
      responseText = `I've found some relevant wellness resources regarding **${displayTopic}**:`;

      if (articleMatches.length > 0) {
        responseText += `\n\n**📖 Expert Articles:**` + articleMatches.map(a => `\n\n- [**${a.title}**](/articles/${a.slug})\n  _${a.excerpt ? a.excerpt.substring(0, 80) + '...' : 'Learn more about this topic.'}_`).join("");
      }

      if (recipeMatches.length > 0) {
        responseText += `\n\n**🍳 Wellness Recipes:**` + recipeMatches.map(r => `\n\n- [**${r.title}**](/recipes/${r.slug})\n  _${r.excerpt ? r.excerpt.substring(0, 80) + '...' : 'View the full recipe details.'}_`).join("");
      }

      if (productMatches.length > 0) {
        responseText += `\n\n**🛒 Recommended for you:**` + productMatches.map(p => `\n- **[PRODUCT:${p.id}]**`).join("");
      }
      
      responseText += `\n\nIs there a specific part of **${displayTopic}** you'd like to dive into?`;
    } else {
      responseText = `I couldn't find a direct match for "**${queryWords.join(' ')}**" at ${contextName} right now. \n\nPerhaps try searching for broader terms like "hormones," "stress," or "nutrition"?`;
    }

    return res.status(200).json({ response: responseText });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
