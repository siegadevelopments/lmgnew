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

    // Filter to find the most relevant context for the LLM
    const words = lowerContent.split(/\s+/).filter((w: string) => w.length > 2);
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

    // 3. GENERATION (The "G" in RAG)
    if (!GEMINI_API_KEY) {
      throw new Error("API Key missing");
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    // Trying models that are most likely to work in v1
    const modelsToTry = ["gemini-1.5-flash", "gemini-pro"];
    let botResponse = "";
    let lastError = "";

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: 'v1' });
        const result = await model.generateContent([systemPrompt, content]);
        botResponse = result.response.text();
        if (botResponse) break;
      } catch (e: any) {
        lastError = e.message;
      }
    }

    if (!botResponse) {
      return res.status(500).json({ error: 'RAG failed', details: lastError });
    }

    return res.status(200).json({ response: botResponse });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
