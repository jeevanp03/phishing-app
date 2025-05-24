# PhishGen & PhishBuster

A Next.js web application that demonstrates how AI can both generate phishing emails and detect them. Built for educational purposes to help understand and identify phishing tactics.

## Quick Start

1. **Clone and Install**

   ```bash
   git clone <repository-url>
   cd phishing-app
   npm install
   ```

2. **Get API Key**

   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy the key

3. **Setup Environment**

   ```bash
   # Create .env file
   echo "GEMINI_API_KEY=your_api_key_here" > .env
   ```

4. **Start Development Server**

   ```bash
   npm run dev
   ```

5. **Open Browser**
   - Visit [http://localhost:3000](http://localhost:3000)

## How to Use

1. Click "Generate Phish" to create a simulated phishing email
2. Review the generated email
3. Click "Analyze Email" to see the security analysis
4. Learn from the identified red flags and security recommendations

## Features

- AI-powered phishing email generation
- Real-time email analysis
- Security recommendations
- Clean, modern UI
- Built with Next.js, TypeScript, and Tailwind CSS

## Development

Key files:

- `src/app/page.tsx` - Main UI
- `src/app/api/generate/route.ts` - Email generation API
- `src/app/api/analyze/route.ts` - Email analysis API
- `src/lib/gemini.ts` - Gemini AI integration

## Security Note

This application is for educational purposes only. The generated emails are simulations to help understand and identify phishing tactics. Do not use for malicious purposes.

## License

MIT
