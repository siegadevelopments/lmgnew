function cleanRawJsonContent(str) {
  let clean = str.trim();
  
  clean = clean.replace(/^```(json|html)?\s*/i, "").replace(/\s*```$/, "");
  
  if (clean.startsWith("{") || clean.includes('"content"')) {
    try {
      const jsonMatch = clean.match(/\{[\s\S]*\}/);
      const toParse = jsonMatch ? jsonMatch[0] : clean;
      const parsed = JSON.parse(toParse);
      if (parsed.content) return parsed.content;
    } catch (_) {
    }
  }
  
  if (clean.startsWith('"content": "')) {
    clean = clean.replace(/^"content": "/, "");
    if (clean.endsWith('"')) {
      clean = clean.substring(0, clean.length - 1);
    }
    if (clean.includes('\\"')) {
      return clean.replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\n/g, '\n');
    }
  }
  
  return clean;
}

const badJson1 = `{"content": "<p style="color:red">Test</p>"}`; // invalid json due to unescaped quotes
console.log("badJson1:", cleanRawJsonContent(badJson1));

const badJson2 = `{"content": ""}`; // empty
console.log("badJson2:", cleanRawJsonContent(badJson2));

const badJson3 = `{"title": "Test", "content": "<p>Test</p>"`; // missing closing brace
console.log("badJson3:", cleanRawJsonContent(badJson3));
