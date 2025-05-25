# PhishGen & PhishBuster

An AI-powered educational tool for generating and analyzing phishing emails to help improve cybersecurity awareness.

## Features

### Manual Mode
- Generate realistic phishing emails using AI
- Analyze emails for security vulnerabilities
- Detailed security reports with actionable insights
- Educational insights into phishing tactics

### Email Analysis Modes
#### IMAP Analysis
- Connect to email accounts via IMAP
- Analyze existing emails for phishing attempts
- Support for major email providers (Gmail, Outlook, Yahoo)
- Real-time analysis with OpenAI's GPT-4
- Detailed security reports including:
  - Phishing probability and confidence scores
  - Link analysis and reputation checks
  - Sender domain analysis
  - Header authentication checks
  - Content pattern analysis
  - Actionable recommendations

#### Manual Analysis
- Paste any email content for instant analysis
- No account connection required
- Same comprehensive analysis as IMAP mode
- Perfect for analyzing suspicious emails without connecting accounts
- Quick and easy to use

### Simulation Mode
- Run autonomous phishing simulations with multiple rounds
- Customize target company and simulation parameters
- Adjustable simulation speed (slow, normal, fast)
- Interactive simulation log with expandable rounds
- Detailed analysis of each attempt
- Progress tracking and round management

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/phishing-app.git
cd phishing-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your API keys:
```
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Manual Mode
1. Click "Generate Phish" to create a new phishing email
2. Review the generated email
3. Click "Analyze Email" to get a detailed security analysis
4. Study the analysis to understand the phishing tactics used

### Email Analysis Modes
#### IMAP Analysis
1. Switch to "IMAP Analysis" tab
2. Select your email provider
3. Enter your IMAP credentials:
   - For Gmail: Use an App Password
   - For Outlook: Use your email password
   - For Yahoo: Use an App Password
4. Click "Test Connection" to verify credentials
5. Select the number of emails to analyze
6. Click "Analyze Emails" to start the analysis
7. Review the detailed security report for each email

#### Manual Analysis
1. Switch to "Manual Analysis" tab
2. Paste the email content you want to analyze
3. Click "Analyze Email" to start the analysis
4. Review the detailed security report

### Simulation Mode
1. Switch to "Simulation Mode"
2. Configure simulation parameters:
   - Set target company
   - Choose number of rounds (1-10)
   - Select simulation speed
3. Click "Run Simulation" to start
4. Monitor progress in real-time
5. Review results in the interactive simulation log
6. Use the "Clear Results" button to start a new simulation

## Features in Detail

### Email Generation
- Uses Google's Gemini AI model
- Implements various phishing tactics:
  - Sender spoofing
  - Urgency and fear tactics
  - Authority exploitation
  - Social proof
  - Call to action
  - Personal information requests
  - Time pressure
  - Trust building
  - Curiosity triggers
  - Reciprocity

### Email Analysis
- Comprehensive security report including:
  - Risk level assessment (0-100)
  - Confidence score (0-1)
  - Key red flags identification
  - Security recommendations
  - Technical analysis:
    - Link reputation and redirect chains
    - Sender domain reputation
    - SPF/DKIM/DMARC authentication
    - Header spoofing attempts
  - Content analysis:
    - Urgency level
    - Authority claims
    - Personal info requests
    - Grammatical errors
    - Suspicious patterns

### Simulation Features
- Autonomous learning between rounds
- Context-aware email generation
- Progressive improvement based on analysis
- Interactive round-by-round review
- Expandable detailed views
- Simulation summary statistics

## Security Note

This tool is designed for educational purposes only. It helps users:
- Understand common phishing tactics
- Learn to identify suspicious emails
- Develop better security awareness
- Practice email analysis skills

Do not use this tool for malicious purposes or to create actual phishing campaigns.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
