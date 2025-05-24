import { NextResponse } from 'next/server';
import { analyzePhishingEmail } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email content is required' },
        { status: 400 }
      );
    }

    const analysis = await analyzePhishingEmail(email);
    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Error analyzing email:', error);
    return NextResponse.json(
      { error: 'Failed to analyze email' },
      { status: 500 }
    );
  }
} 