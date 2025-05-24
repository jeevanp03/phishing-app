# PhishGen & PhishBuster

A Next.js web application that demonstrates how AI can both generate phishing emails and detect them. The app features two AI agents – an "attacker" (phishing email generator) and a "defender" (phishing detector) – interacting via a simple UI.

## Features

- Generate realistic phishing emails using Google's Gemini AI
- Analyze emails for phishing indicators using AI
- Clean, modern UI with loading states and error handling
- Built with Next.js, TypeScript, and Tailwind CSS

## Prerequisites

- Node.js 18+ and npm
- Google Gemini API key (get one from [Google AI Studio](https://makersuite.google.com/app/apikey))

## Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd phishing-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Click the "Generate Phish" button to create a new phishing email
2. Review the generated email
3. Click "Analyze Email" to see the AI's analysis of the phishing attempt
4. Repeat to explore different scenarios

## Development

- `src/app/page.tsx` - Main UI component
- `src/app/api/generate/route.ts` - API route for generating phishing emails
- `src/app/api/analyze/route.ts` - API route for analyzing emails
- `src/lib/gemini.ts` - Gemini AI client setup
- `src/components/` - Reusable UI components

## Security Note

This application is for educational purposes only. The generated phishing emails are simulations and should not be used for malicious purposes. Always use AI responsibly and ethically.

## License

MIT
