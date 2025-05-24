import { NextResponse } from 'next/server';
import { generatePhishingEmail, analyzePhishingEmail } from '@/lib/gemini';

interface SimulationRound {
  round: number;
  email: string;
  analysis: string;
}

export async function POST(request: Request) {
  try {
    const { rounds = 3 } = await request.json();
    const simulation: SimulationRound[] = [];
    let previousEmail = '';
    let previousAnalysis = '';

    for (let i = 0; i < rounds; i++) {
      // Generate new email with context from previous round
      const email = await generatePhishingEmail(previousEmail, previousAnalysis);
      
      // Analyze the email
      const analysis = await analyzePhishingEmail(email);
      
      // Store the round results
      simulation.push({
        round: i + 1,
        email,
        analysis
      });

      // Update context for next round
      previousEmail = email;
      previousAnalysis = analysis;
    }

    return NextResponse.json({ simulation });
  } catch (error) {
    console.error('Error in simulation:', error);
    return NextResponse.json(
      { error: 'Failed to run simulation' },
      { status: 500 }
    );
  }
} 