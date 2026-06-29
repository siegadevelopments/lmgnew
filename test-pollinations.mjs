const systemPrompt = "You are an expert copyeditor and proofreader.";
const textsToCheck = { content: "This is a test with bad grammer." };
const userPrompt = `Fix all spelling and grammatical errors in the following JSON object's string values without changing the underlying meaning or HTML structure. 
Return the result as a STRICT JSON object with the exact same keys you received.

Input JSON to correct:
${JSON.stringify(textsToCheck, null, 2)}

CRITICAL: Return ONLY the JSON object. Do not include markdown code blocks.`;

fetch("https://text.pollinations.ai/", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    private: true,
    jsonMode: true
  })
})
.then(res => res.text())
.then(text => console.log("Pollinations AI Response:", text))
.catch(err => console.error(err));
