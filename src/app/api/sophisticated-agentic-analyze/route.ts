import { NextResponse } from 'next/server';
import { openaiFunctionCallingAgent } from '@/lib/agents/openai_function_calling_agent';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Missing email content.' }, { status: 400 });
    }

    // Extract email components
    const { from, subject, date, body, headers = {}, links = [] } = email;

    // Validate required fields
    if (!from || !subject || !date || !body) {
      return NextResponse.json(
        { error: 'Missing required email fields (from, subject, date, body).' },
        { status: 400 }
      );
    }

    const analysis = await openaiFunctionCallingAgent({
      from,
      subject,
      date,
      body,
      headers,
      links,
    });

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Sophisticated agentic analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze email with sophisticated agent.' },
      { status: 500 }
    );
  }
} 