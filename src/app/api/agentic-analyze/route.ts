import { NextResponse } from 'next/server';
import { agenticAnalyzeEmail } from '@/lib/agents/agentic_email_analyzer';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Missing email content.' }, { status: 400 });
    }
    const analysis = await agenticAnalyzeEmail(email);
    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Agentic analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyze email agentically.' }, { status: 500 });
  }
} 