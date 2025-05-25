import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  try {
    const { raw } = await request.json();
    if (!raw) {
      return NextResponse.json({ error: 'Missing raw email content.' }, { status: 400 });
    }

    // Improved prompt with explicit example for informal headers
    const prompt = `You are an expert at parsing raw email text, even if it is informal or missing standard headers.

Extract the following fields and return a JSON object with these keys:
- from: The sender's name or email if available, otherwise "unknown"
- to: The recipient's name or email if available, otherwise "unknown"
- subject: The subject if available, otherwise "unknown"
- date: The date in ISO 8601 format if available, otherwise "unknown"
- body: The main message content (everything after any greeting or header)
- headers: All headers as a key-value object, or an empty object if not present
- links: All URLs in the body as an array

If any field is missing, set it to "unknown" or an empty value as appropriate.
If the email is just a conversational message, do your best to infer the sender, recipient, and date from the text or set them to "unknown".

If the email starts with a block like:
Chloe Okereke
26 Apr 2025, 07:18
to me

then:
- Set "from" to "Chloe Okereke"
- Set "date" to "2025-04-26T07:18:00" (convert to ISO 8601)
- Set "to" to "me" or the recipient mentioned

Return ONLY the JSON object, no explanation.

Example input:
Chloe Okereke
26 Apr 2025, 07:18
to me

Hi Jeevan,

Sorry – was it the Rattan's you wanted?!
...

Example output:
{
  "from": "Chloe Okereke",
  "to": "me",
  "subject": "unknown",
  "date": "2025-04-26T07:18:00",
  "body": "Hi Jeevan,\n\nSorry – was it the Rattan's you wanted?!\n...",
  "headers": {},
  "links": []
}

Email:
${raw}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert email parser.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0,
      max_tokens: 512,
    });

    const content = response.choices[0].message.content;
    let parsed;
    try {
      parsed = JSON.parse(content || '{}');
    } catch (err) {
      return NextResponse.json({ error: 'Failed to parse LLM output as JSON.', raw: content }, { status: 500 });
    }

    return NextResponse.json({ email: parsed });
  } catch (error) {
    console.error('LLM email parse error:', error);
    return NextResponse.json({ error: 'Failed to parse email with LLM.' }, { status: 500 });
  }
} 