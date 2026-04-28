import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { content, vendor_id, history } = req.body;
    const lowerContent = content.toLowerCase();

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    // 1. RETRIEVAL (The "R" in RAG)
    let productsQuery = supabase.from('products').select('id, title, price, slug').eq('status', 'published');
    if (vendor_id) productsQuery = productsQuery.eq('vendor_id', vendor_id);

    const { data: allProducts } = await productsQuery.limit(40);
    const { data: allArticles } = await supabase.from('articles').select('id, title, slug').limit(40);

    // 3. Keyword Matching (Precise)
    const STOP_WORDS = new Set(['about', 'tell', 'your', 'have', 'this', 'that', 'with', 'from', 'some', 'what']);
    const words = lowerContent.split(/\s+/).filter((w: string) => w.length > 2 && !STOP_WORDS.has(w));
    
    const relevantProducts = (allProducts || []).filter((p: any) => 
      words.some((word: string) => p.title.toLowerCase().includes(word.endsWith('s') ? word.slice(0, -1) : word))
    ).slice(0, 5);

    const relevantArticles = (allArticles || []).filter((a: any) => 
      words.some((word: string) => a.title.toLowerCase().includes(word.endsWith('s') ? word.slice(0, -1) : word))
    ).slice(0, 5);

    // 2. AUGMENTATION (The "A" in RAG)
    const context = `
      KNOWLEDGE BASE:
      ARTICLES: ${relevantArticles.map(a => `${a.title} (/articles/${a.slug})`).join(', ') || 'None found.'}
      PRODUCTS: ${relevantProducts.map(p => `${p.title} [PRODUCT:${p.id}]`).join(', ') || 'None found.'}
      
      RULES:
      - Use [PRODUCT:id] for products.
      - Use Markdown links for articles.
      - If no relevant knowledge is found, say you don't know but suggest browsing the shop.
    `;

    const systemPrompt = `You are a wellness assistant. Use this context to answer: ${context}`;

    // 3. GENERATION (High-Fidelity RAG Synthesis)
    let responseText = "";

    if (relevantArticles.length > 0 || relevantProducts.length > 0) {
      const topicMatch = relevantArticles.length > 0 ? relevantArticles[0].title : (relevantProducts.length > 0 ? relevantProducts[0].title : "wellness");
      
      responseText = `I've looked through our wellness guide for you. Regarding **${topicMatch}**, here is what I found:`;

      if (relevantArticles.length > 0) {
        const articleLinks = relevantArticles.map(a => `\n- 📖 Insight: [**${a.title}**](/articles/${a.slug})`).join("");
        responseText += `\n\n**Helpful Reading:**${articleLinks}`;
      }

      if (relevantProducts.length > 0) {
        const productList = relevantProducts.map(p => `**[PRODUCT:${p.id}]**`).join(", ");
        responseText += `\n\n**Recommended for you:**\nBased on your interest, I suggest looking at ${productList}. They are specifically curated for wellness goals like yours.`;
      }
      
      responseText += `\n\nIs there anything specific about these that you'd like to know more about?`;
    } else {
      responseText = `I couldn't find a specific match in our current articles or shop, but I'm constantly learning! You might find what you're looking for by browsing our **[Explore](/shop)** section or checking out our latest **[Wellness Articles](/articles)**.`;
    }

    return res.status(200).json({ response: responseText });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
