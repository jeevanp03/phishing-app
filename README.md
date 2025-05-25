# PhishGen & PhishBuster

An AI-powered educational tool for generating and analyzing phishing emails to help improve cybersecurity awareness. Built with Next.js, OpenAI, and modern frontend best practices.

---

## 🚀 Project Overview

PhishGen & PhishBuster lets you:

- **Generate** realistic phishing emails for training and awareness.
- **Analyze** any email (manual paste, IMAP, or simulation) for phishing risk, red flags, and technical signals.
- **Learn** about phishing tactics and how to spot them, with detailed, actionable reports.

---

## ✨ Key Features

### Manual Mode

- Generate realistic phishing emails using AI.
- Paste any email content for instant analysis—no account connection required.
- Get detailed security reports with actionable insights and educational breakdowns.

### IMAP Analysis

- Connect to your email account (Gmail, Outlook, Yahoo, etc.) via IMAP.
- Analyze real emails for phishing attempts using OpenAI's GPT-4.
- Get comprehensive reports: link reputation, sender domain, header checks, content patterns, and more.

### Simulation Mode

- Run autonomous phishing simulations with multiple rounds.
- Customize target company, simulation speed, and other parameters.
- Review interactive logs and round-by-round analysis.

---

## 🤖 LLM-Powered Email Parsing

### Smart LLM Parse (Frontend)

- On the Manual Email Analysis page, select **Sophisticated Agentic Analysis** and enable the **Smart LLM Parse** checkbox.
- The pasted email is parsed using both a regex-based parser and an LLM-powered parser (OpenAI GPT-4o).
- Results are merged: LLM fields are preferred, regex is used as fallback.
- If required fields (`from`, `subject`, `date`, `body`) are missing, the UI prompts you to fill them in before analysis proceeds.
- The parsed/merged object is shown in the UI for transparency and debugging.

### LLM Email Parsing API

- **Endpoint:** `POST /api/llm-email-parse`
- **Request body:** `{ raw: <pasted email string> }`
- Uses a robust prompt (with examples) to extract sender, recipient, date, body, headers, and links—even from informal or headerless emails.
- Returns a JSON object with all required fields, filling in "unknown" if a field cannot be inferred.
- **Example output:**
  ```json
  {
    "from": "Chloe Okereke",
    "to": "me",
    "subject": "unknown",
    "date": "2025-04-26T07:18:00",
    "body": "Hi Jeevan,\n\nSorry – was it the Rattan's you wanted?!\n...",
    "headers": {},
    "links": ["https://dukeanddexter.com/pages/returns"]
  }
  ```

#### How the Parsing Flow Works

1. **Paste any email** (with or without headers) into the Manual Analysis page.
2. **Enable Smart LLM Parse** (optional, but recommended for informal emails).
3. The system parses the email with both regex and LLM.
4. **Merging:** LLM results are used where available; regex fills in gaps.
5. If any required fields are missing, you are prompted to fill them in manually.
6. The final, complete email object is sent to the backend agent for analysis.

---

## 🛠️ Developer/Contributor Notes

- The LLM prompt is designed to handle both standard and informal emails, and includes explicit examples to guide the model.
- If the LLM or regex parser cannot extract all required fields, the UI will prompt the user to fill them in manually.
- The backend agent will always receive a valid, complete email object, ensuring robust analysis and no more "Failed to analyze email" errors due to missing fields.
- You can further tune the LLM prompt or add more examples in `src/app/api/llm-email-parse/route.ts`.
- The parsing/merging logic is in `src/components/ManualEmailAnalyzer.tsx`.

---

## 🧑‍💻 How to Use

1. Go to **Manual Analysis**.
2. Paste any email (with or without headers).
3. Select **Sophisticated Agentic Analysis** and (optionally) enable **Smart LLM Parse**.
4. Click **Analyze**. If required fields are missing, fill them in when prompted.
5. View the parsed object and analysis results.

---

## ⚙️ Requirements

- OpenAI API key (set as `OPENAI_API_KEY` in your environment)

---

## 📝 Changelog

- **2024-06:** Added LLM-powered parsing, robust merging, and UI fallback for missing fields.

---

## 📚 Getting Started

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
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   # (Optional) GEMINI_API_KEY=your_gemini_api_key_here
   ```
   - Gemini key is needed for some of the non-agent features, the agent features are used with openai
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 Security Note

This tool is designed for educational purposes only. It helps users:

- Understand common phishing tactics
- Learn to identify suspicious emails
- Develop better security awareness
- Practice email analysis skills

**Do not use this tool for malicious purposes or to create actual phishing campaigns.**

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
