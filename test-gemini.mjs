const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Set via environment variable

const systemPrompt = "You are an expert copyeditor and proofreader.";
const textsToCheck = { 
  content: "<p>This is a test. It have bad grammer and speling.</p><ul><li>One</li><li>Tow</li></ul>",
  title: "A bad title"
};

const userPrompt = `Fix all spelling and grammatical errors in the following JSON object's string values without changing the underlying meaning or HTML structure. 
Return the result as a STRICT JSON object with the exact same keys you received.

Input JSON to correct:
${JSON.stringify(textsToCheck, null, 2)}

CRITICAL: Return ONLY the JSON object. Do not include markdown code blocks.`;

fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
      responseMimeType: "application/json"
    }
  })
})
.then(res => res.json())
.then(data => {
  let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  console.log("Raw Gemini:", text);
  text = text.replace(/```json/g, "").replace(/```html/g, "").replace(/```/g, "").trim();
  console.log("Cleaned:", text);
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const toParse = jsonMatch ? jsonMatch[0] : text;
    console.log("Parsed:", JSON.parse(toParse));
  } catch(e) {
    console.error("Parse Error:", e);
  }
})
.catch(err => console.error(err));
