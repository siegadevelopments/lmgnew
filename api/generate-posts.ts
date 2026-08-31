import { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
`;

// Helper to extract year, month, day components from date strings safely
function getYearMonthDayComponents(dateStr: string): { year: number; month: number; day: number } {
  const matchIso = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (matchIso) {
    return {
      year: parseInt(matchIso[1], 10),
      month: parseInt(matchIso[2], 10),
      day: parseInt(matchIso[3], 10)
    };
  }
  const d = new Date(dateStr);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate()
  };
}

// Helper to convert Melbourne local components to UTC ISO string
function parseMelbourneDateTimeToUTC(year: number, month: number, day: number, hour: number): string {
  const inputAsUTC = Date.UTC(year, month - 1, day, hour, 0, 0);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Australia/Melbourne",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23"
  });
  
  const parts = formatter.formatToParts(new Date(inputAsUTC));
  const partMap = new Map(parts.map(p => [p.type, p.value]));
  
  const targetYear = Number(partMap.get("year"));
  const targetMonth = Number(partMap.get("month"));
  const targetDay = Number(partMap.get("day"));
  const targetHour = Number(partMap.get("hour"));
  const targetMinute = Number(partMap.get("minute"));
  
  const melbourneAsUTC = Date.UTC(targetYear, targetMonth - 1, targetDay, targetHour, targetMinute);
  const offset = melbourneAsUTC - inputAsUTC;
  return new Date(inputAsUTC - offset).toISOString();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    // 1. Authenticate as admin
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    );

    const userClient = createClient(
      process.env.VITE_SUPABASE_URL || "",
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();
    if (authError || !user) return res.status(401).json({ error: "Invalid token" });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "admin") return res.status(403).json({ error: "Admin access required" });

    const {
      numWeeks = 4,
      startDate,
      selectedDays = [1, 3, 5],
      specificDates = null,
      targetTime = "09:00",
      targetPlatform = "both",
      autoPushBuffer = false,
      selectedVendorId = null,
      selectedProductIds = [],
    } = req.body || {};
    
    const postsPerWeek = selectedDays ? selectedDays.length : 0;
    const totalPostsCount = specificDates ? specificDates.length : numWeeks * postsPerWeek;

    if (totalPostsCount === 0)
      return res.status(400).json({ error: "No dates selected for generation" });

    // Fetch existing scheduled posts to prevent duplication
    const { data: existingPosts } = await supabase
      .from("scheduled_posts")
      .select("source_id")
      .not("source_id", "is", null);
      
    const usedSourceIds = new Set((existingPosts || []).map((p: any) => p.source_id));

    // 2. Fetch all content
    const articlesQuery = supabase
      .from("articles")
      .select("id, title, slug, excerpt, image_url, category_name")
      .eq("status", "published")
      .limit(50);
      
    let productsQuery = supabase
      .from("products")
      .select("id, title, slug, price, excerpt, image_url, category, brand")
      .eq("status", "published");
      
    if (selectedProductIds && selectedProductIds.length > 0) {
      productsQuery = productsQuery.in("id", selectedProductIds);
    } else if (selectedVendorId) {
      productsQuery = productsQuery.eq("vendor_id", selectedVendorId);
    }
    productsQuery = productsQuery.limit(50);

    const recipesQuery = supabase.from("recipes").select("id, title, slug, excerpt, image_url").limit(50);

    const [articlesRes, productsRes, recipesRes] = await Promise.all([
      articlesQuery,
      productsQuery,
      recipesQuery,
    ]);

    const articles = (articlesRes.data || []).filter((a: any) => !usedSourceIds.has(String(a.id)));
    const products = (productsRes.data || []).filter((p: any) => !usedSourceIds.has(String(p.id)));
    const recipes = (recipesRes.data || []).filter((r: any) => !usedSourceIds.has(String(r.id)));

    const totalContent = articles.length + products.length + recipes.length;
    if (totalContent === 0) {
      return res.status(400).json({ error: "No new content found to generate posts from. All recent content may have already been posted." });
    }

    // 3. Generate with Gemini AI
    const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";
    if (!geminiKey) return res.status(500).json({ error: "GEMINI_API_KEY not configured" });

    // Extract selected hour & minute (Melbourne time)
    const [timeHrStr, timeMinStr] = (targetTime || "09:00").split(":");
    const customHour = parseInt(timeHrStr || "9", 10);

    const genAI = new GoogleGenerativeAI(geminiKey);

    // Day names or dates for prompt
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const scheduleText = specificDates
      ? `Specific dates: ${specificDates.join(", ")}`
      : `${postsPerWeek} posts per week, on: ${selectedDays.map((d: number) => dayNames[d]).join(", ")}`;

    // Keep content summaries small to reduce token usage
    const contentSummary = JSON.stringify({
      articles: articles
        .slice(0, 20)
        .map((a) => ({
          id: a.id,
          title: a.title,
          slug: a.slug,
          excerpt: (a.excerpt || "").substring(0, 100),
          category: a.category_name,
          image: a.image_url,
        })),
      products: products
        .slice(0, 20)
        .map((p) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          price: p.price,
          excerpt: (p.excerpt || "").substring(0, 100),
          category: p.category,
          brand: p.brand,
          image: p.image_url,
        })),
      recipes: recipes
        .slice(0, 10)
        .map((r) => ({
          id: r.id,
          title: r.title,
          slug: r.slug,
          excerpt: (r.excerpt || "").substring(0, 100),
          image: r.image_url,
        })),
    });

    const generationPrompt = `${AUDIENCE_PROMPT}

TASK: Generate exactly ${totalPostsCount} social media posts for the following schedule.
SCHEDULE: ${scheduleText}

CONTENT TO PROMOTE:
${contentSummary}

DISTRIBUTION STRATEGY:
- Mix educational articles (40%), product features (40%), and recipes/lifestyle (20%).
- Ensure content rotates logically across the selected days.
- Focus on building trust early and converting towards the end of the batch.

POST TYPES TO ROTATE:
1. "Did You Know?" — Educational hook with article link
2. "Try This" — Practical tip with recipe link  
3. "Meet [Product]" — Gentle product feature with benefits
4. "Real Talk" — Empathetic post about a common symptom, then solution
5. "Self-Care Ritual" — Wellness suggestion
6. "Quick Win" — One small change that makes a big difference
7. "Community Question" — Engagement post asking for experiences

REQUIREMENTS FOR EACH POST:
- "title": short topic title (e.g. "5 Gut-Friendly Foods for Perimenopause")
- "facebook": Engaging Facebook caption with conversational tone, story hook, emojis, the actual article/product link from the content above, and STRICTLY 2-3 hashtags max. DO NOT write literal placeholder strings like "{source_url}" or "Title:" or "Link:". Write the actual readable post copy.
- "instagram": High-engagement Instagram caption with emojis, line breaks (\\n), CTA to visit link in bio or the actual website link from the content above, and STRICTLY 3-5 relevant hashtags at the end. DO NOT write literal placeholder strings like "{source_url}" or "Title:" or "Link:".
- "pinterest": STRICT RULE - Must be CONCISE and UNDER 450 CHARACTERS total (including title, description, actual website link, and hashtags) so it never breaches Pinterest's 500-char limit. Start with a catchy Pin Title, brief description, actual CTA link, and 2-3 targeted hashtags. DO NOT write literal placeholder strings like "{source_url}" or "Title:" or "Link:".
- "source_type": "article" | "product" | "recipe" | "custom"
- "source_id": the id from the content above (as string), or null for custom
- "source_url": relative URL like "/articles/slug" or "/shop/product-slug" or null
- "image_url": the image URL from the source content, or null
- "time_slot": "morning" | "midday" | "evening"

OUTPUT: Return ONLY a valid JSON array of ${totalPostsCount} objects. No markdown, no explanation, just the JSON array.`;

    // Try with retry and model fallback for rate limiting
    const MODELS = [
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-1.5-pro"
    ];
    let posts: any[] | null = null;
    let lastError = "";

    for (const modelName of MODELS) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          console.log(`Attempt ${attempt + 1} with model ${modelName}`);
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(generationPrompt);
          const responseText = result.response.text();

          const jsonMatch = responseText.match(/\[[\s\S]*\]/);
          if (!jsonMatch) throw new Error("AI response did not contain a valid JSON array");
          posts = JSON.parse(jsonMatch[0]);
          break;
        } catch (err: any) {
          lastError = err.message || "Unknown error";
          console.error(`Model ${modelName} attempt ${attempt + 1} failed:`, lastError);

          if (
            lastError.includes("429") ||
            lastError.includes("quota") ||
            lastError.includes("Too Many Requests")
          ) {
            const waitMs = (attempt + 1) * 3000;
            console.log(`Rate limited. Waiting ${waitMs}ms before retry...`);
            await new Promise((resolve) => setTimeout(resolve, waitMs));
          } else {
            break;
          }
        }
      }
      if (posts && posts.length > 0) break;
    }

    if (!posts || posts.length === 0) {
      const isQuotaError = lastError.includes("quota") || lastError.includes("429");
      return res.status(429).json({
        error: isQuotaError ? "AI Rate Limit Reached" : "AI Generation Failed",
        details: lastError,
        suggestion: isQuotaError
          ? "The AI is currently busy or out of quota. Please wait 1-2 minutes and try again."
          : "Check your Gemini API key and try again.",
      });
    }

    // 4. Schedule posts
    const timeSlots: Record<string, number> = {
      morning: 9,
      midday: 12,
      evening: 18,
    };

    const scheduledPosts = [];

    const createPostEntriesForSlot = (post: any, scheduledAtISO: string, slotIndex: number) => {
      const baseTitle = post.title || `Post ${slotIndex + 1}`;
      const imageUrl = post.image_url || null;
      const sourceType = post.source_type || "custom";
      const sourceId = post.source_id ? String(post.source_id) : null;
      const sourceUrl = post.source_url || null;

      const cleanCaptionText = (rawText: string) => {
        let text = rawText || "";
        // Remove literal placeholder template tags
        text = text.replace(/\{source_url\}/gi, sourceUrl || "");
        // Remove structural labels at the start of text or lines
        text = text.replace(/^(Title|Caption|Link|Description|Post):\s*/gmi, "");
        return text.trim();
      };

      // Facebook Version
      const fbCaption = cleanCaptionText(post.facebook || post.caption);
      // Instagram Version
      const igCaption = cleanCaptionText(post.instagram || post.caption);
      // Pinterest Version (ensuring < 500 chars)
      let pinCaption = cleanCaptionText(post.pinterest || post.caption);
      if (pinCaption.length > 495) {
        pinCaption = pinCaption.slice(0, 492) + "...";
      }

      return [
        {
          title: `${baseTitle} (FB)`,
          caption: fbCaption,
          hashtags: [],
          image_url: imageUrl,
          source_type: sourceType,
          source_id: sourceId,
          source_url: sourceUrl,
          platforms: ["facebook"],
          scheduled_at: scheduledAtISO,
          status: "draft",
        },
        {
          title: `${baseTitle} (IG)`,
          caption: igCaption,
          hashtags: [],
          image_url: imageUrl,
          source_type: sourceType,
          source_id: sourceId,
          source_url: sourceUrl,
          platforms: ["instagram"],
          scheduled_at: scheduledAtISO,
          status: "draft",
        },
        {
          title: `${baseTitle} (Pin)`,
          caption: pinCaption,
          hashtags: [],
          image_url: imageUrl,
          source_type: sourceType,
          source_id: sourceId,
          source_url: sourceUrl,
          platforms: ["pinterest"],
          scheduled_at: scheduledAtISO,
          status: "draft",
        },
      ];
    };

    if (specificDates && specificDates.length > 0) {
      // Use exact specific dates
      posts.forEach((post, index) => {
        const dateStr = specificDates[index];
        if (!dateStr) return;
        
        const { year, month, day } = getYearMonthDayComponents(dateStr);
        const hour = customHour !== undefined ? customHour : (timeSlots[post.time_slot] || 9);
        const scheduledAtISO = parseMelbourneDateTimeToUTC(year, month, day, hour);

        scheduledPosts.push(...createPostEntriesForSlot(post, scheduledAtISO, index));
      });
    } else {
      // Use weekly pattern logic
      const baseDate = startDate ? new Date(startDate) : new Date();
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Australia/Melbourne",
        year: "numeric",
        month: "numeric",
        day: "numeric",
      });
      const parts = formatter.formatToParts(baseDate);
      const map = new Map(parts.map(p => [p.type, p.value]));
      
      const startYear = Number(map.get("year"));
      const startMonth = Number(map.get("month"));
      const startDay = Number(map.get("day"));
      
      const melbourneDate = new Date(Date.UTC(startYear, startMonth - 1, startDay));
      melbourneDate.setUTCDate(melbourneDate.getUTCDate() + 1); // Start tomorrow

      let postIndex = 0;
      while (postIndex < posts.length) {
        if (selectedDays.includes(melbourneDate.getUTCDay())) {
          const post = posts[postIndex];
          const hour = customHour !== undefined ? customHour : (timeSlots[post.time_slot] || 9);
          
          const scheduledAtISO = parseMelbourneDateTimeToUTC(
            melbourneDate.getUTCFullYear(),
            melbourneDate.getUTCMonth() + 1,
            melbourneDate.getUTCDate(),
            hour
          );

          scheduledPosts.push(...createPostEntriesForSlot(post, scheduledAtISO, postIndex));
          postIndex++;
        }
        melbourneDate.setUTCDate(melbourneDate.getUTCDate() + 1);
        if (scheduledPosts.length > 1500) break; // Safety
      }
    }

    // Set status to approved if auto-pushing to Buffer
    if (autoPushBuffer) {
      scheduledPosts.forEach(p => { p.status = "approved"; });
    }

    // 5. Insert into database
    const { data: inserted, error: insertError } = await supabase
      .from("scheduled_posts")
      .insert(scheduledPosts)
      .select();

    if (insertError) {
      console.error("Insert error:", insertError);
      return res.status(500).json({ error: "Failed to save posts", details: insertError.message });
    }

    // 6. Push to Buffer API directly if autoPushBuffer is true
    const bufferWarnings: string[] = [];
    if (autoPushBuffer && inserted && inserted.length > 0) {
      // Group inserted post entries by scheduled_at date
      const groupedBySlot: Record<string, { facebook?: string; instagram?: string; pinterest?: string; imageUrl?: string; scheduledAt: string }> = {};
      
      for (const row of inserted) {
        const key = row.scheduled_at;
        if (!groupedBySlot[key]) {
          groupedBySlot[key] = { scheduledAt: key, imageUrl: row.image_url };
        }
        const platform = row.platforms?.[0];
        if (platform === "facebook") groupedBySlot[key].facebook = row.caption;
        if (platform === "instagram") groupedBySlot[key].instagram = row.caption;
        if (platform === "pinterest") groupedBySlot[key].pinterest = row.caption;
      }

      // Send each date slot to Buffer
      const bufferToken = process.env.BUFFER_ACCESS_TOKEN || process.env.VITE_BUFFER_ACCESS_TOKEN;
      const originUrl = req.headers.origin || "http://localhost:3000";

      for (const slotKey of Object.keys(groupedBySlot)) {
        const slotData = groupedBySlot[slotKey];
        try {
          const bRes = await fetch(`${originUrl}/api/buffer-auto-publish`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageUrl: slotData.imageUrl,
              scheduledAt: slotData.scheduledAt,
              posts: {
                facebook: slotData.facebook,
                instagram: slotData.instagram,
                pinterest: slotData.pinterest,
              },
            }),
          });
          const bData = await bRes.json();
          if (bData.warnings && Array.isArray(bData.warnings)) {
            bufferWarnings.push(...bData.warnings);
          }
          if (bData.results && Array.isArray(bData.results)) {
            for (const item of bData.results) {
              if (item.platform && item.id) {
                await supabase
                  .from("scheduled_posts")
                  .update({ buffer_post_id: item.id })
                  .eq("scheduled_at", slotData.scheduledAt)
                  .contains("platforms", [item.platform]);
              }
            }
          }
        } catch (bErr: any) {
          console.error(`Error auto-pushing slot ${slotKey} to Buffer:`, bErr);
          bufferWarnings.push(`Slot ${slotKey}: ${bErr.message}`);
        }
      }
    }

    return res.status(200).json({
      success: true,
      count: inserted?.length || 0,
      bufferWarnings: bufferWarnings.length > 0 ? bufferWarnings : undefined,
      message: `Generated ${inserted?.length || 0} posts (FB, IG, Pinterest) across ${numWeeks} weeks & pushed to Buffer!`,
    });
  } catch (error: any) {
    console.error("Generate posts error:", error);
    return res.status(500).json({ error: error.message });
  }
}
