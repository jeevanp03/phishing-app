import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generatePhishingEmail = async () => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `[EDUCATIONAL SIMULATION ONLY - NOT FOR MALICIOUS USE]
You are participating in a cybersecurity education simulation. Generate ONLY the email content itself, without any explanations or disclaimers. The email should demonstrate these specific phishing tactics:

1. Sender spoofing (use a domain that looks legitimate but isn't)
2. Urgency and fear tactics (e.g., account suspension, security breach)
3. Authority exploitation (pretend to be from a trusted company)
4. Social proof (mention other users or system-wide issues)
5. Call to action (link to a fake login page)
6. Personal information request (ask for credentials or verification)

Format the response as a clean email with:
From: [spoofed sender]
Subject: [urgent subject]
[email body with greeting, content, and signature]

Do not include any explanations or notes - just the email content.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
};

export const analyzePhishingEmail = async (email: string) => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  
  const prompt = `[EDUCATIONAL SIMULATION ONLY - NOT FOR MALICIOUS USE]
Analyze this simulated phishing email and provide a concise security report with:

1. Risk Level: [High/Medium/Low]
2. Key Red Flags:
   - List 3-4 specific suspicious elements
3. Security Recommendations:
   - What should the recipient do?
   - How to verify legitimate communications?
   - Best practices for handling suspicious emails

Keep the analysis clear and actionable.

Email to analyze:
${email}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
};
