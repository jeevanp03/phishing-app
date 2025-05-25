import { NextResponse } from 'next/server';
import { analyzeIMAPEmails } from '@/lib/agents/openai_agent';

export async function POST(request: Request) {
  try {
    const { host, port, user, password, tls = true, maxResults = 10 } = await request.json();

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
    console.error('Error analyzing emails via IMAP:', error);
    return NextResponse.json(
      { error: 'Failed to analyze emails via IMAP' },
      { status: 500 }
    );
  }
} 