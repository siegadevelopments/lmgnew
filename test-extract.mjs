function extractBrokenJsonContent(str) {
  let extracted = str;
  // Try to match "content": "..." ending before another key or the end of the JSON object
  const contentMatch = str.match(/"content"\s*:\s*"(.*?)"(?:\s*,\s*"[^"]+"\s*:|\s*\})/s);
  if (contentMatch && contentMatch[1]) {
    extracted = contentMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\n/g, '\n');
  } else {
     // Try a looser match if it's the last property
     const looseMatch = str.match(/"content"\s*:\s*"(.*)/s);
     if (looseMatch && looseMatch[1]) {
       extracted = looseMatch[1].replace(/"\s*\}\s*$/, "").replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\n/g, '\n');
     }
  }
  return extracted;
}

const bad1 = `{"content": "<p style=\\"color:red\\">Test</p>"}`;
console.log(1, extractBrokenJsonContent(bad1));

const bad2 = `{\n  "title": "A title",\n  "content": "<p>Hello</p>\\n<p>World</p>"\n}`;
console.log(2, extractBrokenJsonContent(bad2));

const bad3 = `{"content": "<p>Unescaped "quotes" here</p>"}`;
console.log(3, extractBrokenJsonContent(bad3));
