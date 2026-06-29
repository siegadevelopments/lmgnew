const type = "article";
const obj = {
  contents: [{ role: "user", parts: [] }],
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 2048,
    ...( (type === "recipe" || type === "grammar") ? { responseMimeType: "application/json" } : {} )
  }
};
console.log(obj);
