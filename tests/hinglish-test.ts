// Test file to verify Hinglish detection functionality

// Import the detectHinglish function (we'll test it manually)
const detectHinglish = (text: string): boolean => {
  if (!text || typeof text !== 'string') return false;
  
  const textLower = text.toLowerCase();
  
  // Strong indicators - definitely Hinglish
  const strongIndicators = [
    // Devanagari characters (most reliable indicator)
    /[\u0900-\u097F]/,
    // Hindi transliterations (specific patterns)
    /\b(kya|hai|nahi|toh|aur|bhi|se|ko|ka|ki|le|diya|liya|raha|gaya|padh|chahiye|chahiye|kyun|kyu|kaise|kahan|kab|mein|se|ke|ki|ka|ne|kiya|kartha|karti|padhana|padhana|padhna|padhne|padhao|padhi|padha|yeh|wo|vo|us|un|in|inhon|unhen|mere|meri|mera|tere|teri|tera|apne|apni|apna|sab|koi|kuch|kitna|kitne|kitni)\b/i,
    // Hindi numbers
    /\b(ek|do|teen|char|paanch|chhash|saat|aath|nau|das|gyarah|barah|therah|choudah|pandrah|solah|satrah|atharah|unne|bees|tees|chalis|pachas|saath|sattain|assi|nabbe|nauve)\b/i,
    // Mixed language patterns with Hindi suffixes
    /\b[a-zA-Z]+([aeiou]*[a-z]*(kar|ke|ki|ka|me|se|ko|nahi|hai|raha|gaya|rahe|hote))\b/i,
    // Common Hinglish phrases
    /\b(bhai|dude|yaar|arrey|yaar|jaise ki|aise ki|aise hi|bas|bilkul|bilkul nah|thoda|thodi|pata|abhi|phir|bada|sab|kaam|karna|karni|karna hai|ho ja|ho gaya|kyu|kyun|kaise|kaaise|kahan|kahaan|kab|kabhi)\b/i
  ];
  
  // Weak indicators - can be English too, need more context
  const weakIndicators = [
    /\b(padhai|study|exam|test|marks)\b/i,
    /\b(time|paisa|help|good|nice)\b/i,
    /\b(want|need|work|job)\b/i
  ];
  
  // Check for strong indicators first
  if (strongIndicators.some(pattern => pattern.test(text))) {
    return true;
  }
  
  // If no strong indicators, check for weak indicators + multiple patterns
  const weakMatches = weakIndicators.filter(pattern => pattern.test(text)).length;
  const hasBasicHindiWords = /\b(aur|ye|wo|is|us|me|se|ke|ki|ka|to|ya|le)\b/i.test(text);
  
  // If we have multiple weak matches or weak + basic Hindi, consider it Hinglish
  return weakMatches >= 2 || (weakMatches >= 1 && hasBasicHindiWords);
};

// Test cases
const testCases = [
  // Hinglish test cases
  { input: "Bhai, Python programming kaise start karu?", expected: true },
  { input: "Kya tumhare paas time hai? Main help chahta hu", expected: true },
  { input: "Study karne ka best method kya hai?", expected: true },
  { input: "Please explain quantum physics in simple terms", expected: true },
  { input: "Main physics padh raha hu, aur mujhe mechanics samajh nahi aa raha", expected: true },
  
  // English test cases  
  { input: "What is machine learning?", expected: false },
  { input: "I need help with mathematics", expected: false },
  { input: "Please explain the concept", expected: false },
  { input: "This is a good explanation", expected: false },
  
  // Mixed cases
  { input: "Kya aap help kar sakte hain?", expected: true },
  { input: "The algorithm is very good but implementation karne me problem ho rahi hai", expected: true },
  { input: "Thank you bhai!", expected: true }
];

// Run tests
console.log("🧪 Testing Hinglish Detection...\n");

testCases.forEach((testCase, index) => {
  const result = detectHinglish(testCase.input);
  const status = result === testCase.expected ? "✅ PASS" : "❌ FAIL";
  
  console.log(`Test ${index + 1}: ${status}`);
  console.log(`Input: "${testCase.input}"`);
  console.log(`Expected: ${testCase.expected}, Got: ${result}`);
  console.log(`---\n`);
});

console.log("✅ Hinglish detection test completed!");