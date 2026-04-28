import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { content, vendor_id, history } = req.body;

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!supabaseUrl || !supabaseServiceKey || !GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Missing environment variables' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch Vendor Context
    const { data: vendor, error: vendorError } = await supabase
      .from('vendor_profiles')
      .select('store_name, store_description, ai_instructions')
      .eq('id', vendor_id)
      .single();

    if (vendorError) {
      return res.status(500).json({ error: 'Vendor fetch error', details: vendorError.message });
    }

    // 2. Fetch Product Context
    const { data: products } = await supabase
      .from('products')
      .select('id, title, price, slug, image_url')
      .eq('vendor_id', vendor_id)
      .eq('status', 'published')
      .limit(20);

    const productContext = (products || [])
      .map(p => `- [PRODUCT:${p.id}] ${p.title} ($${p.price})`)
      .join('\n');

    const systemPrompt = `
      You are an AI Sales Assistant for "${vendor?.store_name || 'our store'}".
      
      VENDOR DESCRIPTION: ${vendor?.store_description || 'Wellness store.'}
      INSTRUCTIONS: ${vendor?.ai_instructions || 'Be helpful.'}
      
      AVAILABLE PRODUCTS:
      ${productContext}
      
      RULES:
      1. Use [PRODUCT:id] to recommend items.
      2. Keep answers concise.
      3. Focus only on products provided.
    `;

    // 3. Initialize Google AI (FORCING STABLE v1 VERSION)
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const modelsToTry = ["gemini-1.5-flash", "gemini-pro"];
    let botResponse = "";
    let lastError = "";

    for (const modelName of modelsToTry) {
      try {
        // Use v1 instead of v1beta
        const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: "v1" });
        
        const chat = model.startChat({
          history: [
            { role: "user", parts: [{ text: systemPrompt }] },
            ...history.map((h: any) => ({
              role: h.sender_id === vendor_id ? "model" : "user",
              parts: [{ text: h.content }]
            }))
          ],
        });

        const result = await chat.sendMessage(content);
        botResponse = result.response.text();
        if (botResponse) break;
      } catch (e: any) {
        lastError = e.message;
        console.error(`Model ${modelName} failed:`, e.message);
      }
    }

    if (!botResponse) {
      return res.status(500).json({ error: 'AI generation failed', details: lastError });
    }

    return res.status(200).json({ response: botResponse });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
