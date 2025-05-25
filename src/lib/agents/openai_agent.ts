import { ChatOpenAI } from "@langchain/openai";
import { RunnableSequence } from "@langchain/core/runnables";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { z } from "zod";
import { URL } from "url";
// @ts-ignore
import { ImapFlow, ImapFlowOptions } from "imapflow";
import { simpleParser, ParsedMail } from "mailparser";
import { StructuredOutputParser } from "@langchain/core/output_parsers";

// Define ResponseSchema locally since it's not exported by langchain
type ResponseSchema = {
  name: string;
  description: string;
};
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} from "@langchain/core/prompts";

// Define our state schema using Zod
const EmailSchema = z.object({
  id: z.string(),
  from: z.string(),
  subject: z.string(),
  body: z.string(),
  date: z.string(),
  headers: z.record(z.string()).optional(),
  links: z.array(z.string()).optional(),
});

const LinkAnalysisSchema = z.object({
  url: z.string(),
  isSuspicious: z.boolean(),
  reasons: z.array(z.string()),
  redirectChain: z.array(z.string()).optional(),
});

const SenderAnalysisSchema = z.object({
  domain: z.string(),
  reputation: z.enum(["good", "neutral", "poor"]),
  reasons: z.array(z.string()),
  spf: z.boolean().optional(),
  dkim: z.boolean().optional(),
  dmarc: z.boolean().optional(),
});

const HeaderAnalysisSchema = z.object({
  spoofingAttempts: z.boolean(),
  suspiciousHeaders: z.array(z.string()),
  authenticationResults: z.record(z.boolean()).optional(),
});

const ContentPatternSchema = z.object({
  urgencyLevel: z.number().min(0).max(1),
  authorityClaims: z.array(z.string()),
  personalInfoRequests: z.array(z.string()),
  grammaticalErrors: z.array(z.string()),
  suspiciousPatterns: z.array(z.string()),
});

const AnalysisSchema = z.object({
  isPhishing: z.boolean(),
  confidence: z.number().min(0).max(1),
  riskScore: z.number().min(0).max(100),
  reasons: z.array(z.string()),
  recommendations: z.array(z.string()),
  linkAnalysis: z.array(LinkAnalysisSchema).optional(),
  senderAnalysis: SenderAnalysisSchema.optional(),
  headerAnalysis: HeaderAnalysisSchema.optional(),
  contentPatterns: ContentPatternSchema.optional(),
});

const AnalyzedEmailSchema = z.object({
  email: EmailSchema,
  analysis: AnalysisSchema,
});

type Email = z.infer<typeof EmailSchema>;
type Analysis = z.infer<typeof AnalysisSchema>;
type AnalyzedEmail = z.infer<typeof AnalyzedEmailSchema>;

// Initialize OpenAI
const model = new ChatOpenAI({
  modelName: "gpt-4-turbo-preview",
  temperature: 0,
});

// Structured output parser for phishing analysis
const schemas = {
  isPhishing: "true if this is phishing",
  confidence: "0–1 confidence score",
  riskScore: "0–100 risk score",
  reasons: "list of reasons it is phishing or not",
  recommendations: "actionable next steps",
};
const parser = StructuredOutputParser.fromNamesAndDescriptions(schemas);

const prompt = ChatPromptTemplate.fromPromptMessages([
  SystemMessagePromptTemplate.fromTemplate(
    `You are a phishing-detector. Analyze the incoming email and return a JSON object matching the following schema:\n\n{format_instructions}\n`
  ),
  HumanMessagePromptTemplate.fromTemplate(
    `From: {from}\nSubject: {subject}\nDate: {date}\nBody: {body}\n\nAdditional Analysis:\n{additionalAnalysis}\n`
  ),
]);

// Extract links from email body
function extractLinks(body: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return body.match(urlRegex) || [];
}

// Analyze email headers
function analyzeHeaders(
  headers: Record<string, string>
): z.infer<typeof HeaderAnalysisSchema> {
  const analysis: z.infer<typeof HeaderAnalysisSchema> = {
    spoofingAttempts: false,
    suspiciousHeaders: [],
    authenticationResults: {},
  };

  // Check for common spoofing attempts
  const fromHeader = headers["from"] || "";
  const replyToHeader = headers["reply-to"] || "";
  const returnPathHeader = headers["return-path"] || "";

  if (fromHeader !== replyToHeader && replyToHeader) {
    analysis.spoofingAttempts = true;
    analysis.suspiciousHeaders.push("Reply-To differs from From");
  }

  // Check authentication results
  const authResults = headers["authentication-results"] || "";
  if (authResults) {
    analysis.authenticationResults = {
      spf: authResults.includes("spf=pass"),
      dkim: authResults.includes("dkim=pass"),
      dmarc: authResults.includes("dmarc=pass"),
    };
  }

  return analysis;
}

// Analyze sender domain
function analyzeSender(from: string): z.infer<typeof SenderAnalysisSchema> {
  const domain = from.split("@")[1] || "";

  // This is a simplified example. In a real implementation, you would:
  // 1. Check domain age
  // 2. Query reputation databases
  // 3. Check for domain similarity to known brands
  // 4. Verify domain registration details

  const analysis: z.infer<typeof SenderAnalysisSchema> = {
    domain,
    reputation: "neutral",
    reasons: [],
  };

  // Example checks
  if (domain.includes("gmail.com") || domain.includes("outlook.com")) {
    analysis.reputation = "good";
  } else if (domain.includes("temp-mail") || domain.includes("throwaway")) {
    analysis.reputation = "poor";
    analysis.reasons.push("Suspicious domain name");
  }

  return analysis;
}

// Add new analysis schemas
const DomainReputationSchema = z.object({
  age: z.number().optional(),
  isKnownBrand: z.boolean(),
  similarityScore: z.number().min(0).max(1),
  blacklistStatus: z.enum(["clean", "suspicious", "malicious"]).optional(),
  registrationInfo: z
    .object({
      registrar: z.string().optional(),
      creationDate: z.string().optional(),
      expirationDate: z.string().optional(),
    })
    .optional(),
});

const LinkReputationSchema = z.object({
  url: z.string(),
  domain: z.string(),
  isKnownPhishing: z.boolean(),
  redirectCount: z.number(),
  finalDestination: z.string().optional(),
  sslStatus: z.enum(["valid", "invalid", "none"]),
  domainAge: z.number().optional(),
});

// Add new analysis functions
async function analyzeDomainReputation(
  domain: string
): Promise<z.infer<typeof DomainReputationSchema>> {
  try {
    // In a real implementation, you would:
    // 1. Query domain age databases
    // 2. Check against known brand names
    // 3. Query blacklists
    // 4. Get registration information
    return {
      isKnownBrand: false,
      similarityScore: 0,
      blacklistStatus: "clean",
    };
  } catch (error: unknown) {
    console.error(`Error analyzing domain reputation for ${domain}:`, error);
    throw new Error(
      `Domain reputation analysis failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

async function analyzeLinkReputation(
  url: string
): Promise<z.infer<typeof LinkReputationSchema>> {
  try {
    const parsedUrl = new URL(url);
    // In a real implementation, you would:
    // 1. Check against phishing databases
    // 2. Follow redirects
    // 3. Verify SSL certificates
    // 4. Check domain age
    return {
      url,
      domain: parsedUrl.hostname,
      isKnownPhishing: false,
      redirectCount: 0,
      sslStatus: "valid",
    };
  } catch (error: unknown) {
    console.error(`Error analyzing link reputation for ${url}:`, error);
    throw new Error(
      `Link reputation analysis failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

// Enhanced content pattern analysis
function analyzeContentPatterns(
  body: string,
  subject: string
): z.infer<typeof ContentPatternSchema> {
  const patterns: z.infer<typeof ContentPatternSchema> = {
    urgencyLevel: 0,
    authorityClaims: [],
    personalInfoRequests: [],
    grammaticalErrors: [],
    suspiciousPatterns: [],
  };

  // Check for urgency
  const urgencyPhrases = [
    "urgent",
    "immediately",
    "asap",
    "last chance",
    "expiring",
    "limited time",
    "act now",
  ];

  urgencyPhrases.forEach((phrase) => {
    if (
      body.toLowerCase().includes(phrase) ||
      subject.toLowerCase().includes(phrase)
    ) {
      patterns.urgencyLevel += 0.2;
      patterns.suspiciousPatterns.push(`Urgency phrase detected: "${phrase}"`);
    }
  });

  // Check for authority claims
  const authorityPhrases = [
    "ceo",
    "director",
    "manager",
    "official",
    "security",
    "compliance",
    "legal",
  ];

  authorityPhrases.forEach((phrase) => {
    if (body.toLowerCase().includes(phrase)) {
      patterns.authorityClaims.push(`Authority claim: "${phrase}"`);
    }
  });

  // Check for personal info requests
  const personalInfoPhrases = [
    "password",
    "account",
    "verify",
    "confirm",
    "social security",
    "credit card",
    "bank account",
  ];

  personalInfoPhrases.forEach((phrase) => {
    if (body.toLowerCase().includes(phrase)) {
      patterns.personalInfoRequests.push(`Personal info request: "${phrase}"`);
    }
  });

  // Add new pattern checks
  const suspiciousPatterns = [
    { pattern: /(?:click|tap)\s+here/i, reason: "Generic call-to-action" },
    {
      pattern: /(?:verify|confirm)\s+your\s+account/i,
      reason: "Account verification request",
    },
    {
      pattern: /(?:suspicious|unusual)\s+activity/i,
      reason: "Suspicious activity claim",
    },
    { pattern: /(?:limited|exclusive)\s+offer/i, reason: "Limited time offer" },
    { pattern: /(?:free|gift|prize)/i, reason: "Free offer or prize" },
  ];

  suspiciousPatterns.forEach(({ pattern, reason }) => {
    if (pattern.test(body) || pattern.test(subject)) {
      patterns.suspiciousPatterns.push(reason);
    }
  });

  // Check for grammatical errors
  const commonErrors = [
    { pattern: /(?:dear\s+valued\s+customer)/i, reason: "Generic greeting" },
    { pattern: /(?:kindly\s+verify)/i, reason: "Unnatural language" },
    {
      pattern: /(?:urgent\s+response\s+required)/i,
      reason: "Overly formal urgency",
    },
  ];

  commonErrors.forEach(({ pattern, reason }) => {
    if (pattern.test(body)) {
      patterns.grammaticalErrors.push(reason);
    }
  });

  return patterns;
}

// IMAP email fetching function using imapflow
export async function fetchEmailsIMAP(
  imapConfig: ImapFlowOptions,
  maxResults: number = 10
): Promise<Email[]> {
  const client = new ImapFlow(imapConfig);
  const emails: Email[] = [];
  try {
    await client.connect();
    let lock = await client.getMailboxLock("INBOX");
    try {
      let seq = Math.max(1, client.mailbox.exists - maxResults + 1);
      for await (let message of client.fetch(`${seq}:*`, {
        source: true,
        envelope: true,
        bodyStructure: true,
      })) {
        const parsed: ParsedMail = await simpleParser(message.source as Buffer);
        const from = parsed.from?.text || "";
        const subject = parsed.subject || "";
        const date = parsed.date ? parsed.date.toISOString() : "";
        const body = parsed.text || "";
        const headers: Record<string, string> = {};
        for (let [key, value] of parsed.headers) {
          headers[key] = value as string;
        }
        const links = extractLinks(body);
        emails.push({
          id: message.uid.toString(),
          from,
          subject,
          body,
          date,
          headers,
          links,
        });
      }
    } finally {
      lock.release();
    }
    await client.logout();
    return emails;
  } catch (error) {
    await client.logout().catch(() => {});
    throw error;
  }
}

// Add progress tracking interface
interface ProgressCallback {
  onStart?: (totalEmails: number) => void;
  onProgress?: (current: number, total: number, email: Email) => void;
  onComplete?: (analyzedEmails: AnalyzedEmail[]) => void;
  onError?: (error: Error, email?: Email) => void;
}

// Main function to run the analysis using IMAP
export async function analyzeIMAPEmails(
  imapConfig: ImapFlowOptions,
  maxResults: number = 10,
  progressCallback?: ProgressCallback
) {
  function safeString(val: string | undefined | null) {
    return val && val.trim() ? val : "Unknown";
  }
  try {
    // Fetch emails using IMAP
    const emails = await fetchEmailsIMAP(imapConfig, maxResults);
    const analyzedEmails: AnalyzedEmail[] = [];

    progressCallback?.onStart?.(emails.length);

    for (let i = 0; i < emails.length; i++) {
      const currentEmail = emails[i];
      // Defensive check for required fields
      if (
        !currentEmail.from ||
        !currentEmail.subject ||
        !currentEmail.date ||
        !currentEmail.body
      ) {
        console.warn("Skipping email due to missing fields:", {
          id: currentEmail.id,
          from: currentEmail.from,
          subject: currentEmail.subject,
          date: currentEmail.date,
          body: currentEmail.body,
        });
        continue;
      }
      try {
        progressCallback?.onProgress?.(i + 1, emails.length, currentEmail);

        // Perform additional analysis
        const headerAnalysis = analyzeHeaders(currentEmail.headers || {});
        const senderAnalysis = analyzeSender(currentEmail.from);
        const contentPatterns = analyzeContentPatterns(
          currentEmail.body,
          currentEmail.subject
        );
        const domainReputation = await analyzeDomainReputation(
          senderAnalysis.domain
        );
        const linkAnalysis = await Promise.all(
          (currentEmail.links || []).map((link) => analyzeLinkReputation(link))
        );

        const additionalAnalysis = JSON.stringify(
          {
            headerAnalysis,
            senderAnalysis,
            contentPatterns,
            domainReputation,
            linkAnalysis,
          },
          null,
          2
        );

        // Structured output parser: get format instructions
        const formatInstructions = parser.getFormatInstructions();
        const chain = prompt.pipe(model).pipe(parser);
        const promptInput = {
          from: safeString(currentEmail.from),
          subject: safeString(currentEmail.subject),
          date: safeString(currentEmail.date),
          body: safeString(currentEmail.body),
          additionalAnalysis,
          format_instructions: formatInstructions,
        };
        console.log("Prompt input for email analysis:", promptInput);

        let parsedAnalysis;
        try {
          parsedAnalysis = await chain.invoke(promptInput);
        } catch (err) {
          console.error(
            `Invalid or incomplete analysis for email ${currentEmail.id}:`,
            err
          );
          progressCallback?.onError?.(
            err instanceof Error ? err : new Error(String(err)),
            currentEmail
          );
          continue;
        }

        const combinedAnalysis = {
          // Ensure required fields are present and types are correct
          reasons: Array.isArray(parsedAnalysis.reasons)
            ? parsedAnalysis.reasons
            : typeof parsedAnalysis.reasons === "string"
            ? [parsedAnalysis.reasons]
            : [],
          isPhishing:
            typeof parsedAnalysis.isPhishing === "boolean"
              ? parsedAnalysis.isPhishing
              : parsedAnalysis.isPhishing === "true",
          confidence:
            typeof parsedAnalysis.confidence === "number"
              ? parsedAnalysis.confidence
              : parseFloat(parsedAnalysis.confidence) || 0,
          riskScore:
            typeof parsedAnalysis.riskScore === "number"
              ? parsedAnalysis.riskScore
              : parseFloat(parsedAnalysis.riskScore) || 0,
          recommendations: Array.isArray(parsedAnalysis.recommendations)
            ? parsedAnalysis.recommendations
            : typeof parsedAnalysis.recommendations === "string"
            ? [parsedAnalysis.recommendations]
            : [],
          linkAnalysis: linkAnalysis.map((link) => ({
            url: link.url,
            isSuspicious: link.isKnownPhishing || link.sslStatus !== "valid",
            reasons: [
              link.isKnownPhishing ? "Known phishing domain" : null,
              link.sslStatus !== "valid" ? "Invalid SSL certificate" : null,
              link.redirectCount > 2 ? "Multiple redirects" : null,
            ].filter(Boolean) as string[],
          })),
          senderAnalysis: {
            ...senderAnalysis,
            domainReputation,
          },
          headerAnalysis,
          contentPatterns,
        };

        analyzedEmails.push({
          email: currentEmail,
          analysis: combinedAnalysis,
        });
      } catch (error: unknown) {
        console.error(`Error analyzing email ${currentEmail.id}:`, error);
        progressCallback?.onError?.(
          error instanceof Error ? error : new Error(String(error)),
          currentEmail
        );
        continue;
      }
    }

    progressCallback?.onComplete?.(analyzedEmails);
    return analyzedEmails;
  } catch (error: unknown) {
    console.error("Error in email analysis:", error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}
