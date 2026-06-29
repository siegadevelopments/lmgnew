const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Set via environment variable

const systemPrompt = "You are an expert copyeditor and proofreader. Your ONLY job is to identify and fix spelling, grammar, and punctuation errors. You MUST correct any mistakes you find.";
const textsToCheck = { 
  content: "<p>The benifits of turmeric are widely knowen. It reduce inflamation.</p>",
};

const userPrompt = `Fix ALL spelling, punctuation, and grammatical errors in the following JSON object's string values. 
Make the text read naturally and professionally. DO NOT change the HTML tags or structure.

Input JSON to correct:
${JSON.stringify(textsToCheck, null, 2)}

CRITICAL: Return the corrected result as a STRICT JSON object with the exact same keys. Do not include markdown code blocks.`;

fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
    generationConfig: {
      temperature: 0.1, // Lower temperature to force it to be analytical rather than creative
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
      responseMimeType: "application/json"
    }
  })
})
.then(res => res.json())
.then(data => {
  let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  console.log("Raw Gemini:", text);
})
.catch(err => console.error(err));
