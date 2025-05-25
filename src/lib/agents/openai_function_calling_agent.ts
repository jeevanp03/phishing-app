import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Tool: Header Analysis
function headerAnalysis({
  headers = {},
}: {
  headers?: Record<string, string>;
}) {
  const results: any = {
    spoofing: false,
    suspicious: [],
    spf: false,
    dkim: false,
    dmarc: false,
  };

  // Safely access headers with default empty string
  const fromHeader = headers["from"] || "";
  const replyToHeader = headers["reply-to"] || "";

  if (fromHeader && replyToHeader && fromHeader !== replyToHeader) {
    results.spoofing = true;
    results.suspicious.push("Reply-To differs from From");
  }

  const auth = headers["authentication-results"] || "";
  results.spf = auth.includes("spf=pass");
  results.dkim = auth.includes("dkim=pass");
  results.dmarc = auth.includes("dmarc=pass");

  return results;
}

// Tool: Domain Reputation (stub)
function domainReputation({ domain }: { domain: string }) {
  if (domain.endsWith("gmail.com") || domain.endsWith("outlook.com")) {
    return {
      reputation: "good",
      age: 20,
      blacklist: false,
      isKnownBrand: true,
    };
  } else if (domain.includes("temp-mail") || domain.includes("throwaway")) {
    return { reputation: "poor", age: 0, blacklist: true, isKnownBrand: false };
  } else {
    return {
      reputation: "neutral",
      age: 2,
      blacklist: false,
      isKnownBrand: false,
    };
  }
}

// Tool: Content Pattern Detection
function contentPattern({ body }: { body: string }) {
  const patterns = {
    urgency:
      /urgent|immediately|asap|last chance|expiring|limited time|act now/i,
    authority: /ceo|director|manager|official|security|compliance|legal/i,
    personal:
      /password|account|verify|confirm|social security|credit card|bank account/i,
    suspicious:
      /click here|verify your account|suspicious activity|limited offer|free|gift|prize/i,
  };
  const found: any = {};
  for (const [key, regex] of Object.entries(patterns)) {
    found[key] = regex.test(body);
  }
  return found;
}

// Tool: Link Reputation (stub)
function linkReputation({ url }: { url: string }) {
  if (url.includes("bit.ly") || url.includes("tinyurl")) {
    return { isKnownPhishing: true, ssl: false, redirects: 2, domainAge: 0 };
  } else if (url.startsWith("https://")) {
    return { isKnownPhishing: false, ssl: true, redirects: 0, domainAge: 5 };
  } else {
    return { isKnownPhishing: false, ssl: false, redirects: 0, domainAge: 1 };
  }
}

// Tool: Final Answer (forces LLM to summarize)
function finalAnswer({
  riskScore,
  confidence,
  isPhishing,
  redFlags,
  recommendations,
  toolResults,
}: any) {
  return {
    riskScore,
    confidence,
    isPhishing,
    redFlags,
    recommendations,
    toolResults,
  };
}

// Tool: Score Email (heuristic risk/confidence scoring)
function scoreEmail({ toolResults }: { toolResults: Record<string, any> }) {
  let riskScore = 10;
  let confidence = 0.5;
  const notes: string[] = [];

  // Header analysis
  if (toolResults.headerAnalysis) {
    if (toolResults.headerAnalysis.spoofing) {
      riskScore += 30;
      confidence += 0.2;
      notes.push("Header spoofing detected.");
    }
    if (
      !toolResults.headerAnalysis.spf ||
      !toolResults.headerAnalysis.dkim ||
      !toolResults.headerAnalysis.dmarc
    ) {
      riskScore += 10;
      confidence += 0.1;
      notes.push("Missing SPF/DKIM/DMARC.");
    }
  }

  // Domain reputation
  if (toolResults.domainReputation) {
    if (toolResults.domainReputation.reputation === "poor") {
      riskScore += 30;
      confidence += 0.2;
      notes.push("Poor domain reputation.");
    } else if (toolResults.domainReputation.reputation === "neutral") {
      riskScore += 10;
      confidence += 0.05;
      notes.push("Neutral domain reputation.");
    }
    if (toolResults.domainReputation.blacklist) {
      riskScore += 30;
      confidence += 0.2;
      notes.push("Domain is blacklisted.");
    }
  }

  // Content pattern
  if (toolResults.contentPattern) {
    if (toolResults.contentPattern.urgency) {
      riskScore += 10;
      confidence += 0.05;
      notes.push("Urgency detected in content.");
    }
    if (toolResults.contentPattern.suspicious) {
      riskScore += 10;
      confidence += 0.05;
      notes.push("Suspicious content patterns detected.");
    }
    if (toolResults.contentPattern.personal) {
      riskScore += 10;
      confidence += 0.05;
      notes.push("Personal info request detected.");
    }
  }

  // Link reputation
  if (toolResults.linkReputation) {
    if (toolResults.linkReputation.isKnownPhishing) {
      riskScore += 30;
      confidence += 0.2;
      notes.push("Known phishing link detected.");
    }
    if (!toolResults.linkReputation.ssl) {
      riskScore += 5;
      notes.push("Link does not use SSL.");
    }
    if (toolResults.linkReputation.redirects > 1) {
      riskScore += 5;
      notes.push("Multiple redirects in link.");
    }
  }

  // Clamp values
  riskScore = Math.max(0, Math.min(100, riskScore));
  confidence = Math.max(0, Math.min(1, confidence));

  return {
    riskScore,
    confidence,
    notes,
  };
}

// Tool schemas for OpenAI function calling
const toolSchemas = [
  {
    name: "headerAnalysis",
    description:
      "Analyze email headers for spoofing, SPF/DKIM/DMARC, and suspicious patterns.",
    parameters: {
      type: "object",
      properties: {
        headers: {
          type: "object",
          description: "Email headers as key-value pairs",
        },
      },
      required: ["headers"],
    },
  },
  {
    name: "domainReputation",
    description:
      "Check domain reputation, age, blacklist status, and similarity to known brands.",
    parameters: {
      type: "object",
      properties: {
        domain: { type: "string", description: "Domain to check" },
      },
      required: ["domain"],
    },
  },
  {
    name: "contentPattern",
    description:
      "Detect urgency, authority, personal info requests, and suspicious phrases in email body.",
    parameters: {
      type: "object",
      properties: {
        body: { type: "string", description: "Email body" },
      },
      required: ["body"],
    },
  },
  {
    name: "linkReputation",
    description:
      "Check if a link is known phishing, SSL status, redirects, and domain age.",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string", description: "URL to check" },
      },
      required: ["url"],
    },
  },
  {
    name: "scoreEmail",
    description:
      "Score the email for phishing risk and confidence based on tool results.",
    parameters: {
      type: "object",
      properties: {
        toolResults: {
          type: "object",
          description: "Results from all tools used so far",
        },
      },
      required: ["toolResults"],
    },
  },
  {
    name: "finalAnswer",
    description:
      "Provide the final phishing risk verdict and reasoning as a structured JSON.",
    parameters: {
      type: "object",
      properties: {
        riskScore: {
          type: "number",
          description: "Phishing risk score (0-100)",
        },
        confidence: { type: "number", description: "Confidence (0-1)" },
        isPhishing: { type: "boolean", description: "Is this phishing?" },
        redFlags: {
          type: "array",
          items: { type: "string" },
          description: "Red flags found",
        },
        recommendations: {
          type: "array",
          items: { type: "string" },
          description: "Actionable recommendations",
        },
        toolResults: {
          type: "object",
          description: "Results from all tools used",
        },
      },
      required: [
        "riskScore",
        "confidence",
        "isPhishing",
        "redFlags",
        "recommendations",
        "toolResults",
      ],
    },
  },
];

// Tool registry
const toolRegistry: Record<string, Function> = {
  headerAnalysis,
  domainReputation,
  contentPattern,
  linkReputation,
  finalAnswer,
  scoreEmail,
};

// Main agent loop
export async function openaiFunctionCallingAgent({
  from,
  subject,
  date,
  body,
  headers = {},
  links = [],
}: {
  from: string;
  subject: string;
  date: string;
  body: string;
  headers?: Record<string, string>;
  links?: string[];
}) {
  // Compose initial user message with proper JSON encoding
  const messages: any[] = [
    {
      role: "system",
      content: `You are a phishing email analysis agent. Follow these steps in order:
1. Call headerAnalysis on the headers
2. Call domainReputation on the domain from the email address
3. Call contentPattern on the email body
4. Call linkReputation on any links
5. Call scoreEmail with the collected toolResults
6. Finally, call finalAnswer with the complete analysis

You MUST follow this order and MUST always finish by calling the finalAnswer function, even if you are unsure.`,
    },
    {
      role: "user",
      content: JSON.stringify({
        action: "analyzeEmail",
        from,
        subject,
        date,
        body,
        headers,
        links
      })
    },
  ];

  // Initialize toolResults with default values
  let toolResults: Record<string, any> = {
    headerAnalysis: { spoofing: false, suspicious: [], spf: false, dkim: false, dmarc: false },
    domainReputation: null,
    contentPattern: null,
    linkReputation: null,
  };

  let maxSteps = 8;
  let done = false;
  let lastResponse: any = null;

  while (!done && maxSteps-- > 0) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4.1-2025-04-14",
        messages,
        functions: toolSchemas,
        function_call: "auto",
        temperature: 0,
      });

      const msg = response.choices[0].message;
      if (msg.function_call) {
        const { name, arguments: argsJson } = msg.function_call;

        // Safely parse function arguments with fallback
        let args: any;
        try {
          args = JSON.parse(argsJson || "{}");
        } catch (parseError) {
          console.error("Error parsing function arguments:", parseError);
          console.error("Raw arguments:", argsJson);
          args = {}; // Safe fallback
        }

        // Validate tool exists
        if (!toolRegistry[name]) {
          console.error(`Unknown tool called: ${name}`);
          continue;
        }

        // Call the tool with error handling
        try {
          // Override scoreEmail arguments with current toolResults
          let callArgs = args;
          if (name === "scoreEmail") {
            callArgs = { toolResults };
          }

          const toolResult = await toolRegistry[name](callArgs);
          
          // Store tool result
          toolResults[name] = toolResult;

          // Add function response to messages
          messages.push({
            role: "function",
            name,
            content: JSON.stringify(toolResult),
          });

          // If finalAnswer, we're done
          if (name === "finalAnswer") {
            done = true;
            lastResponse = toolResult;
          }
        } catch (toolError: unknown) {
          console.error(`Error executing tool ${name}:`, toolError);
          // Add error message to conversation
          messages.push({
            role: "function",
            name,
            content: JSON.stringify({
              error: `Tool execution failed: ${
                toolError instanceof Error
                  ? toolError.message
                  : String(toolError)
              }`,
            }),
          });
        }
      } else if (msg.content) {
        // If model returns a direct answer, treat as final
        lastResponse = msg.content;
        done = true;
      } else {
        // Unexpected, break
        console.warn("Unexpected response format from OpenAI");
        break;
      }
    } catch (error) {
      console.error("Error in agent loop:", error);
      // Return partial results if available
      if (lastResponse) {
        return lastResponse;
      }
      throw error;
    }
  }

  // Debug logging
  console.log("[Agent] Final messages:", messages);
  console.log("[Agent] lastResponse:", lastResponse);

  // Always return a valid result
  if (!lastResponse) {
    return { error: "No analysis could be performed." };
  }

  // Break circular reference by creating a clean copy without finalAnswer
  const cleanToolResults = { ...toolResults };
  delete cleanToolResults.finalAnswer;

  // Return final response with clean toolResults
  return {
    ...lastResponse,
    toolResults: cleanToolResults
  };
}
