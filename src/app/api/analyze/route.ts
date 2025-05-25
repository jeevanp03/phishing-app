import { NextResponse } from 'next/server';
import { analyzeIMAPEmails } from '@/lib/agents/openai_agent';
import { analyzePhishingEmail } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Handle manual email analysis
    if (body.email) {
      const analysis = await analyzePhishingEmail(body.email);
      return NextResponse.json({ analysis });
    }

    // Handle IMAP analysis
    const { host, port, user, password, tls = true, maxResults = 10 } = body;

    if (!host || !port || !user || !password) {
      return NextResponse.json(
        { error: 'IMAP credentials (host, port, user, password) are required' },
        { status: 400 }
      );
    }

    const imapConfig = { host, port, auth: { user, pass: password }, tls };

    const analyzedEmails = await analyzeIMAPEmails(imapConfig, maxResults);
    return NextResponse.json({ analyzedEmails });
  } catch (error) {
    console.error('Error analyzing email:', error);
    return NextResponse.json(
      { error: 'Failed to analyze email' },
      { status: 500 }
    );
  }
} 