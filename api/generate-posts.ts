import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const AUDIENCE_PROMPT = `
You are a world-class social media marketing strategist for "Lifestyle Medicine Gateway" — 
an Australian wellness marketplace focused on natural, holistic health products and education.

TARGET AUDIENCE PROFILES:

🎯 PRIMARY: "Midlife Wellness Seeker"
- Women aged 40–65 in Australia
- Going through perimenopause, menopause, or post-menopause
- Struggling with hot flushes, fatigue, weight gain, poor sleep, hormonal imbalance
- Research-driven buyers who read blogs and watch videos before purchasing
- Prefer trusted, educational brands with safe, proven solutions
- Respond to: supportive, calm, reassuring, empowering but realistic tone
- NO medical jargon overload, NO hype, NO aggressive sales language

💡 SECONDARY: "Supportive Buyer"  
- Partners, daughters, or caregivers aged 30–60
- Wanting to help someone struggling with menopause
- Need easy-to-understand guidance and giftable solutions

🌿 TOP-OF-FUNNEL: "Preventative Wellness Woman"
- Women aged 30–45 into gut health, fitness, hormone balance
- Heavy content consumers before buying

BRAND VOICE:
- Warm, knowledgeable, like a trusted friend who happens to be a wellness expert
- Science-backed but relatable — use phrases like "research shows" not "studies indicate"
- Empathetic — acknowledge the struggle before offering the solution
- Australian English spelling (colour, centre, organised)
- Use emojis naturally but not excessively (2-4 per post)
`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // 1. Authenticate as admin
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const userClient = createClient(
      process.env.VITE_SUPABASE_URL || '',
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

    // 2. Fetch all content
    const [articlesRes, productsRes, recipesRes] = await Promise.all([
      supabase.from('articles').select('id, title, slug, excerpt, image_url, category_name').eq('status', 'published').limit(50),
      supabase.from('products').select('id, title, slug, price, excerpt, image_url, category, brand').eq('status', 'published').limit(50),
      supabase.from('recipes').select('id, title, slug, excerpt, image_url').limit(50),
    ]);

    const articles = articlesRes.data || [];
    const products = productsRes.data || [];
    const recipes = recipesRes.data || [];

    const totalContent = articles.length + products.length + recipes.length;
    if (totalContent === 0) {
      return res.status(400).json({ error: 'No content found to generate posts from.' });
    }

    // 3. Generate with Gemini AI
    const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
    if (!geminiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

    const genAI = new GoogleGenerativeAI(geminiKey);

    // Keep content summaries small to reduce token usage
    const contentSummary = JSON.stringify({
      articles: articles.slice(0, 20).map(a => ({ id: a.id, title: a.title, slug: a.slug, excerpt: (a.excerpt || '').substring(0, 100), category: a.category_name, image: a.image_url })),
      products: products.slice(0, 20).map(p => ({ id: p.id, title: p.title, slug: p.slug, price: p.price, excerpt: (p.excerpt || '').substring(0, 100), category: p.category, brand: p.brand, image: p.image_url })),
      recipes: recipes.slice(0, 10).map(r => ({ id: r.id, title: r.title, slug: r.slug, excerpt: (r.excerpt || '').substring(0, 100), image: r.image_url })),
    });

    const generationPrompt = `${AUDIENCE_PROMPT}

TASK: Generate exactly 30 social media posts for the next 30 days.

CONTENT TO PROMOTE:
${contentSummary}

DISTRIBUTION STRATEGY:
- Week 1 (Days 1-7): 60% educational articles, 20% recipes, 20% soft product mentions — BUILD TRUST
- Week 2 (Days 8-14): 40% articles, 30% product features, 30% recipes — NURTURE
- Week 3 (Days 15-21): 30% articles, 40% product promotions, 30% engagement posts — CONVERT
- Week 4 (Days 22-30): Mix of best-performing styles, 50% product-focused, 30% testimonial-style, 20% community

POST TYPES TO ROTATE:
1. "Did You Know?" — Educational hook with article link
2. "Try This" — Practical tip with recipe link  
3. "Meet [Product]" — Gentle product feature with benefits
4. "Real Talk" — Empathetic post about a common symptom, then solution
5. "Self-Care Sunday" — Weekend wellness ritual suggestion
6. "Quick Win" — One small change that makes a big difference
7. "Community Question" — Engagement post asking for experiences

REQUIREMENTS FOR EACH POST:
- "title": short internal title (not shown publicly)
- "caption": the actual post text, 150-300 words, with line breaks as \\n
- "hashtags": array of 4-6 hashtags (mix of broad + niche, e.g. #MenopauseSupport #NaturalWellness #AustralianMade)
- "source_type": "article" | "product" | "recipe" | "custom"
- "source_id": the id from the content above (as string), or null for custom
- "source_url": relative URL like "/articles/slug" or "/shop/product-slug" or null
- "image_url": the image URL from the source content, or null
- "time_slot": "morning" | "midday" | "evening"

OUTPUT: Return ONLY a valid JSON array of 30 objects. No markdown, no explanation, just the JSON array.`;

    // Try with retry and model fallback for rate limiting
    const MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash'];
    let posts: any[] | null = null;
    let lastError = '';

    for (const modelName of MODELS) {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          console.log(`Attempt ${attempt + 1} with model ${modelName}`);
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(generationPrompt);
          const responseText = result.response.text();

          const jsonMatch = responseText.match(/\[[\s\S]*\]/);
          if (!jsonMatch) throw new Error('No JSON array found in AI response');
          posts = JSON.parse(jsonMatch[0]);
          break;
        } catch (err: any) {
          lastError = err.message || 'Unknown error';
          console.error(`Model ${modelName} attempt ${attempt + 1} failed:`, lastError);

          if (lastError.includes('429') || lastError.includes('quota') || lastError.includes('Too Many Requests')) {
            const waitMs = Math.pow(2, attempt + 1) * 2000;
            console.log(`Rate limited. Waiting ${waitMs}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitMs));
          } else {
            break;
          }
        }
      }
      if (posts && posts.length > 0) break;
    }

    if (!posts || posts.length === 0) {
      return res.status(429).json({
        error: 'AI generation temporarily unavailable due to rate limits. Please try again in a few minutes.',
        details: lastError,
      });
    }

    // 4. Schedule posts across 30 days
    const { startDate } = req.body || {};
    const baseDate = startDate ? new Date(startDate) : new Date();
    baseDate.setDate(baseDate.getDate() + 1);
    baseDate.setHours(0, 0, 0, 0);

    const timeSlots: Record<string, number> = {
      morning: 9,
      midday: 12,
      evening: 18,
    };

    const scheduledPosts = posts.slice(0, 30).map((post: any, index: number) => {
      const postDate = new Date(baseDate);
      postDate.setDate(postDate.getDate() + index);
      const hour = timeSlots[post.time_slot] || 9;
      postDate.setHours(hour, 0, 0, 0);

      return {
        title: post.title || `Day ${index + 1} Post`,
        caption: post.caption || '',
        hashtags: Array.isArray(post.hashtags) ? post.hashtags : [],
        image_url: post.image_url || null,
        source_type: post.source_type || 'custom',
        source_id: post.source_id ? String(post.source_id) : null,
        source_url: post.source_url || null,
        platforms: ['facebook', 'instagram'],
        scheduled_at: postDate.toISOString(),
        status: 'draft',
      };
    });

    // 5. Insert into database
    const { data: inserted, error: insertError } = await supabase
      .from('scheduled_posts')
      .insert(scheduledPosts)
      .select();

    if (insertError) {
      console.error('Insert error:', insertError);
      return res.status(500).json({ error: 'Failed to save posts', details: insertError.message });
    }

    return res.status(200).json({
      success: true,
      count: inserted?.length || 0,
      message: `Generated ${inserted?.length || 0} posts for the next 30 days!`,
    });

  } catch (error: any) {
    console.error('Generate posts error:', error);
    return res.status(500).json({ error: error.message });
  }
}
