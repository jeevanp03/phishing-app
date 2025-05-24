import { NextResponse } from 'next/server';
import { generatePhishingEmail } from '@/lib/gemini';

export async function POST() {
  try {
    const email = await generatePhishingEmail();
    return NextResponse.json({ email });
  } catch (error) {
    console.error('Error generating phishing email:', error);
    return NextResponse.json(
      { error: 'Failed to generate phishing email' },
      { status: 500 }
    );
  }
} 