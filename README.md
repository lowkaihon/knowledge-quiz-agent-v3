# Personal Knowledge Quiz Agent

An AI-powered learning platform that generates personalized quizzes from your own study materials. Upload PDFs, DOCX files, or paste text directly, and let the AI create customized quizzes with adaptive learning that focuses on your weak areas.

## Demo

https://github.com/user-attachments/assets/7ee18a21-d16b-4a6d-97b4-39c298e07eba

## Features

### Technical Specifications

| Component | Configuration | Details |
|-----------|---------------|---------|
| **Quiz Generation** | GPT-4o-mini | Structured output via AI SDK `generateObject()` |
| **Text Extraction** | unpdf + mammoth | PDF, DOCX, TXT support |
| **Vision Fallback** | GPT-4o-mini | Scanned PDF extraction (first 10 pages) |
| **Database** | Supabase PostgreSQL | Row-Level Security enabled |
| **Authentication** | Username-only | Session-based, no password required |

### Core Capabilities

- **AI-Powered Quiz Generation**: Generate quizzes with multiple-choice, true/false, and short-answer questions
- **Multi-Format Document Support**: Upload PDF, DOCX, TXT files or paste text directly
- **Adaptive Learning**: Personalize quizzes by focusing 60-70% of questions on weak topics
- **Performance Analytics**: Track accuracy by topic, question type, and difficulty
- **Configurable Quizzes**: Adjust length (5-50 questions), difficulty, and question types
- **Vision-Based Extraction**: Automatically extract text from scanned PDFs using GPT-4o-mini vision

### User Experience

- **Simple Authentication**: Username-only login without passwords
- **Progress Tracking**: View strengths, weaknesses, and improvement trends
- **Quiz History**: Review past attempts with detailed breakdowns
- **Study Materials Library**: Manage uploaded content with semantic tags
- **Learning Insights**: Personalized recommendations based on performance

## Tech Stack

### Frontend
- **Next.js 14.2.16** with App Router and TypeScript
- **React 18** for UI components
- **Tailwind CSS 4.1** for styling
- **shadcn/ui** (New York style) for accessible components
- **Recharts** for performance analytics visualization
- **Lucide React** for icons

### Backend
- **Supabase PostgreSQL** with Row-Level Security (RLS)
- **AI SDK 5** (`@ai-sdk/openai`) for OpenAI integration
- **OpenAI GPT-4o-mini** for quiz generation and text extraction

### Document Processing
- **unpdf** for PDF text extraction
- **mammoth** for DOCX text extraction
- **pdfjs-dist** for rendering PDFs (vision fallback)

## AI Integration

### Quiz Generation
Uses AI SDK's `generateObject()` with Zod schemas for structured output:
- Generates questions with unique IDs, topics, and explanations
- Supports configurable difficulty and question type distribution
- References original study material in explanations

### Adaptive Learning
- Analyzes performance analytics to identify weak topics (<60% accuracy)
- Generates personalized quizzes with 60-70% focus on weaknesses
- Uses rolling accuracy from last 10 attempts per topic

### Vision-Based Extraction
Fallback for scanned PDFs when text extraction yields <100 characters:
- Renders PDF pages to images using pdfjs-dist
- Sends to GPT-4o-mini vision for text extraction
- Limited to first 10 pages to manage API costs

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm package manager
- Supabase account with PostgreSQL database
- OpenAI API key

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd knowledge-quiz-agent-v3
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Set up environment variables:**

   Create `.env.local` in the project root:
   ```bash
   OPENAI_API_KEY=your_openai_api_key_here
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   Optional (for server-side admin tasks):
   ```bash
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   SUPABASE_JWT_SECRET=your_jwt_secret
   ```

4. **Initialize the database:**

   Run the setup script via Supabase SQL Editor:
   - `scripts/setup.sql` - Creates tables, RLS policies, and indexes

   Or via psql:
   ```bash
   psql "$SUPABASE_DB_URL" -f scripts/setup.sql
   ```

5. **Start the development server:**
   ```bash
   pnpm dev
   ```

6. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Typical Workflow

1. **Login** - Enter a username (no password required)
2. **Upload Material** - Upload PDF/DOCX/TXT or paste text directly
3. **Configure Quiz** - Set length, difficulty, and question types
4. **Take Quiz** - Answer questions with progress tracking and timer
5. **Review Results** - See score, explanations, and performance breakdown
6. **View Profile** - Track progress, strengths, weaknesses, and insights

### Quiz Configuration Options

| Option | Values | Description |
|--------|--------|-------------|
| Length | 5-50 questions | Slider control |
| Difficulty | Easy, Medium, Hard | Affects question complexity |
| Question Types | Multiple choice, True/False, Short answer | Select one or more |
| Focus on Weaknesses | On/Off | Prioritize weak topics |

## Architecture

### Document Processing Pipeline

```
File Upload → Text Extraction → Semantic Tagging → Database Storage
     │              │                  │                  │
     │         unpdf/mammoth      GPT-4o-mini         Supabase
     │         (or vision)        (generates tags)    (study_materials)
     ▼
  Drag-drop or paste text
```

### Quiz Generation Flow

```
Study Material + Config → GPT-4o-mini → Structured Questions → Quiz Interface
         │                     │                 │                   │
    Content + settings    generateObject()   Zod validation    React components
         │                     │                 │                   │
    Weakness data         AI SDK 5          Question array     User answers
```

### Database Schema

| Table | Purpose |
|-------|---------|
| `users` | Username-based accounts |
| `study_materials` | Uploaded content with semantic tags and metadata |
| `quizzes` | Generated quiz storage for reuse |
| `quiz_results` | Attempt results with performance metrics |
| `performance_analytics` | Aggregated topic-level accuracy |

All tables use Row-Level Security (RLS) for user isolation.

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/generate-quiz` | POST | AI-powered quiz generation |
| `/api/extract-pdf` | POST | Extract text from PDF files |
| `/api/extract-docx` | POST | Extract text from DOCX files |
| `/api/extract-text-vision` | POST | Vision-based PDF text extraction |
| `/api/study-materials` | GET/POST | CRUD for study materials |
| `/api/quiz-results` | GET/POST | Store and retrieve quiz results |
| `/api/performance-analytics` | GET | Get performance metrics and summary |
| `/api/user-weaknesses` | GET | Get list of weak topics |

## Security

### Authentication
- **Username-only**: Simplified login without passwords
- **Session Storage**: User session persisted in browser sessionStorage
- **No Sensitive Data**: No passwords or PII stored

### Database Security
- **Row-Level Security (RLS)**: All tables protected with user-specific policies
- **User Isolation**: Users can only access their own data
- **Policy Enforcement**: SELECT, INSERT, UPDATE, DELETE restricted by user_id

### Session Management
- **Browser-Based**: Sessions cleared on browser close
- **Middleware**: Session updates via cookies for SSR compatibility

## Project Structure

```
knowledge-quiz-agent-v3/
├── app/                              # Next.js App Router
│   ├── page.tsx                      # Main quiz page
│   ├── profile/page.tsx              # User profile & analytics
│   ├── layout.tsx                    # Root layout
│   ├── globals.css                   # Global styles
│   └── api/                          # API routes
│       ├── generate-quiz/            # Quiz generation
│       ├── extract-pdf/              # PDF extraction
│       ├── extract-docx/             # DOCX extraction
│       ├── extract-text-vision/      # Vision extraction
│       ├── study-materials/          # Material CRUD
│       ├── quiz-results/             # Results storage
│       ├── performance-analytics/    # Analytics
│       └── user-weaknesses/          # Weakness detection
├── components/                       # React components
│   ├── auth-wrapper.tsx              # Authentication boundary
│   ├── file-upload.tsx               # File upload with drag-drop
│   ├── quiz-configuration.tsx        # Quiz settings
│   ├── quiz-interface.tsx            # Quiz taking UI
│   ├── quiz-results.tsx              # Results display
│   ├── header.tsx                    # Navigation
│   ├── username-auth.tsx             # Login form
│   └── ui/                           # shadcn/ui components
├── lib/                              # Utilities
│   ├── auth.ts                       # Auth helpers
│   ├── types.ts                      # TypeScript interfaces
│   ├── utils.ts                      # General utilities
│   └── supabase/                     # Supabase clients
│       ├── server.ts                 # Server-side client
│       ├── client.ts                 # Client-side client
│       └── middleware.ts             # Session middleware
├── hooks/                            # Custom React hooks
│   └── use-toast.ts                  # Toast notifications
├── scripts/                          # Database setup
│   └── setup.sql                     # Creates tables, RLS policies, and indexes
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript config
├── next.config.mjs                   # Next.js config
├── middleware.ts                     # Auth middleware
├── components.json                   # shadcn/ui config
└── CLAUDE.md                         # Development guidance
```

## Development

### Commands

```bash
pnpm dev          # Start development server (Turbopack)
pnpm build        # Build for production
pnpm start        # Start production server
pnpm tsc --noEmit # TypeScript type checking
```

### Development Notes

- **Short Answer Validation**: Currently uses exact string matching. Future improvement could use LLM for semantic evaluation.
- **Example PDF**: Use [An Introduction to JavaScript](/examples/An_Introduction_to_JavaScript.pdf) to test the upload feature ([source](https://53.fs1.hubspotusercontent-na1.net/hubfs/53/An_Introduction_to_JavaScript.pdf))

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT
