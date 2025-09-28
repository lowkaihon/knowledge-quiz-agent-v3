# Personal Knowledge Quiz Agent

This is a **Personal Knowledge Quiz Agent** web app designed to help users study more effectively by generating quizzes directly from their own notes and learning materials.  

---

## ✨ New Features
- **Simple username-only authentication** to remember users without full account setup.  
- **Supabase database integration** to store study materials, quiz results, and track progress.  
- **Adaptive learning**: personalize quizzes by focusing on topics where users have demonstrated weaknesses.  
- **Results feedback mechanism**: after each quiz, users receive insights based on both their past and present performance.  
- **Profile page**: review past quiz results, with detailed analysis of strengths, weaknesses, and personalized feedback.  

---

## 🎯 Core Functionality
- Upload study material (PDF, DOCX, TXT) or paste text directly.  
- Extract text from uploaded files or use pasted text as-is.  
- Use `gpt-4o-mini` via AI-SDK to process content and generate quizzes.  
- Support for multiple question types:
  - Multiple-choice (with 1 correct answer + distractors)  
  - True/False  
  - Short answer (fill-in-the-blank)  

---

## ⚙️ Customization
- Choose quiz length (# of questions).  
- Select difficulty level (easy, medium, hard).  
- Pick preferred question type(s).  

---

## 🧑‍💻 Practice Mode
- Take quizzes directly inside the app.  
- After answering, view:  
  - Correct answer  
  - Explanation (from original notes where possible)  
- Results are stored in Supabase and used to analyze strengths and weaknesses.  

---

## 🌐 UI / UX
- Clean, minimal design inspired by Quizlet and Revisely.  
- Simple authentication (username only).  
- Personalized learning journey via adaptive quizzes and feedback.  

**Typical flow:**  
1. Log in with a username.  
2. Upload notes or paste text.  
3. Configure quiz options.  
4. Take the quiz.  
5. View results, feedback, and progress analytics on the profile page.  

---

## 🚀 Setup

1. Install dependencies:
   ```bash
   pnpm install



## Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create `.env.local` file:

   ```bash
   echo "OPENAI_API_KEY=your_openai_api_key_here" > .env.local
   echo "NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url" >> .env.local
   echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key" >> .env.local
   ```

3. Start development:
   ```bash
   pnpm dev
   ```

Open [http://localhost:3000](http://localhost:3000) to start using the Personal Knowledge Quiz web app.


# Development Notes
- Short answer (fill-in-the-blank) questions seem to only accept exact matches. May require LLM to evaluate these open-ended answers.
- Example PDF to use for quiz: https://53.fs1.hubspotusercontent-na1.net/hubfs/53/An_Introduction_to_JavaScript.pdf
- Other information that may be required for SupaBase integration:
  ```POSTGRES_URL="************"
  POSTGRES_PRISMA_URL="*******************"
  SUPABASE_URL="************"
  NEXT_PUBLIC_SUPABASE_URL="************************"
  POSTGRES_URL_NON_POOLING="************************"
  SUPABASE_JWT_SECRET="*******************"
  POSTGRES_USER="*************"
  NEXT_PUBLIC_SUPABASE_ANON_KEY="*****************************"
  POSTGRES_PASSWORD="*****************"
  POSTGRES_DATABASE="*****************"
  SUPABASE_SERVICE_ROLE_KEY="*************************"
  POSTGRES_HOST="*************"
  NEXT_PUBLIC_SUPABASE_ANON_KEY="*****************"```

