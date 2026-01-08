# Personal Knowledge Quiz Agent

An AI-powered learning platform that generates personalized quizzes from your own study materials. Upload PDFs, DOCX files, or paste text directly, and let the AI create customized quizzes with adaptive learning that focuses on your weak areas.

**Live Demo:** [https://app-knowledge-quiz-prod.azurewebsites.net](https://app-knowledge-quiz-prod.azurewebsites.net)

## Features

### Technical Specifications

| Component | Configuration | Details |
|-----------|---------------|---------|
| **Hosting** | Azure App Service | Production deployment with CI/CD |
| **Quiz Generation** | Azure OpenAI (GPT-4o-mini) | Structured output via AI SDK `generateObject()` |
| **Text Extraction** | unpdf + mammoth | PDF, DOCX, TXT support |
| **Vision Fallback** | Azure OpenAI (GPT-4o-mini) | Scanned PDF extraction (first 10 pages) |
| **Database** | Azure PostgreSQL Flexible Server | Row-Level Security enabled |
| **Authentication** | Username-only | Session-based, no password required |
| **Monitoring** | Azure Application Insights | Performance tracking and telemetry |

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

### Backend & Cloud Services
- **Azure App Service** - Production hosting with Node.js 20.x runtime
- **Azure PostgreSQL Flexible Server** - Managed PostgreSQL with Row-Level Security (RLS)
- **Azure OpenAI Service** - GPT-4o-mini deployment for quiz generation
- **Azure Application Insights** - Performance monitoring and telemetry
- **GitHub Actions** - Automated CI/CD pipeline
- **AI SDK 5** (`@ai-sdk/azure`) for Azure OpenAI integration
- **node-postgres (pg)** - Direct PostgreSQL client

### Document Processing
- **unpdf** for PDF text extraction
- **mammoth** for DOCX text extraction
- **pdfjs-dist** for rendering PDFs (vision fallback)

## AI Integration

### Azure OpenAI Service
All AI operations use Azure OpenAI Service with GPT-4o-mini deployment:
- **Provider:** `@ai-sdk/azure` - Official Azure OpenAI provider for AI SDK
- **Deployment:** Custom GPT-4o-mini deployment in Azure
- **API Version:** `preview` with latest features
- **Configuration:** Environment-based resource name and API key

### Quiz Generation
Uses AI SDK's `generateObject()` with Zod schemas for structured output:
- Generates questions with unique IDs, topics, and explanations
- Supports configurable difficulty and question type distribution
- References original study material in explanations
- Powered by Azure OpenAI GPT-4o-mini deployment

### Adaptive Learning
- Analyzes performance analytics to identify weak topics (<60% accuracy)
- Generates personalized quizzes with 60-70% focus on weaknesses
- Uses rolling accuracy from last 10 attempts per topic

### Vision-Based Extraction
Fallback for scanned PDFs when text extraction yields <100 characters:
- Renders PDF pages to images using pdfjs-dist
- Sends to Azure OpenAI GPT-4o-mini vision endpoint for text extraction
- Limited to first 10 pages to manage Azure OpenAI costs

## Getting Started

### Prerequisites
- **Node.js 20+** and **pnpm 10+** package manager
- **Azure account** with the following services:
  - Azure PostgreSQL Flexible Server
  - Azure OpenAI Service with GPT-4o-mini deployment
  - (Optional) Azure Application Insights for monitoring

### Local Development Setup

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
   # Azure PostgreSQL connection string
   DATABASE_URL="postgresql://[username]:[password]@[server].postgres.database.azure.com:5432/[database]?sslmode=require"

   # Azure OpenAI Service
   AZURE_OPENAI_RESOURCE_NAME="your-openai-resource-name"
   AZURE_OPENAI_API_KEY="your-azure-openai-api-key"

   # Azure Application Insights (optional)
   APPLICATIONINSIGHTS_CONNECTION_STRING="InstrumentationKey=...;IngestionEndpoint=https://..."
   ```

4. **Initialize the database:**

   Run the setup script on your Azure PostgreSQL instance:
   ```bash
   psql "$DATABASE_URL" -f scripts/setup.sql
   ```

   This creates:
   - 5 tables (`users`, `study_materials`, `quizzes`, `quiz_results`, `performance_analytics`)
   - Row-Level Security (RLS) policies
   - Indexes for query optimization

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

### Azure Cloud Architecture

```
GitHub Actions (CI/CD)
    ↓ [Build & Deploy]
Azure App Service (Node.js 20.x)
    ├─ Next.js App Router
    ├─ API Routes
    └─ Static Assets

Connected Services:
    ├─ Azure PostgreSQL Flexible Server (Database)
    ├─ Azure OpenAI Service (GPT-4o-mini)
    └─ Azure Application Insights (Monitoring)
```

### Document Processing Pipeline

```
File Upload → Text Extraction → Semantic Tagging → Database Storage
     │              │                  │                  │
     │         unpdf/mammoth      Azure OpenAI       Azure PostgreSQL
     │         (or vision)        (generates tags)    (study_materials)
     ▼
  Drag-drop or paste text
```

### Quiz Generation Flow

```
Study Material + Config → Azure OpenAI → Structured Questions → Quiz Interface
         │                  (GPT-4o-mini)          │                   │
    Content + settings      generateObject()   Zod validation    React components
         │                  via AI SDK 5           │                   │
    Weakness data       Azure deployment      Question array     User answers
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
│   ├── layout.tsx                    # Root layout (with App Insights)
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
├── lib/                              # Utilities & Azure integrations
│   ├── auth.ts                       # Auth helpers
│   ├── types.ts                      # TypeScript interfaces
│   ├── utils.ts                      # General utilities
│   ├── database/                     # Azure PostgreSQL client
│   │   └── client.ts                 # Connection pool & query helpers
│   ├── ai/                           # Azure OpenAI integration
│   │   └── azure-openai.ts           # AI SDK provider configuration
│   └── monitoring/                   # Azure monitoring
│       └── appinsights.ts            # Application Insights client
├── .github/                          # GitHub Actions workflows
│   └── workflows/
│       └── azure-app-service-integration_*.yml  # CI/CD deployment
├── hooks/                            # Custom React hooks
│   └── use-toast.ts                  # Toast notifications
├── scripts/                          # Database setup
│   └── setup.sql                     # Creates tables, RLS policies, and indexes
├── .npmrc                            # pnpm configuration (hoisted for Azure)
├── Dockerfile                        # (Not used - standalone mode instead)
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript config
├── next.config.mjs                   # Next.js config (standalone output)
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

## Azure Deployment

### Production Environment

The application is deployed to Azure App Service with the following configuration:

**Azure Resources:**
- **App Service:** `app-knowledge-quiz-prod` (Node.js 20.x, Linux)
- **Resource Group:** `rg-knowledge-quiz-prod`
- **PostgreSQL Server:** Azure Database for PostgreSQL Flexible Server
- **OpenAI Service:** Azure OpenAI with GPT-4o-mini deployment
- **Monitoring:** Azure Application Insights

**Live URL:** [https://app-knowledge-quiz-prod.azurewebsites.net](https://app-knowledge-quiz-prod.azurewebsites.net)

### CI/CD Pipeline

**GitHub Actions Workflow** (`.github/workflows/azure-app-service-integration_*.yml`):

1. **Build Job:**
   - Sets up Node.js 20.x and pnpm 10
   - Installs dependencies with `--frozen-lockfile`
   - Builds Next.js in standalone mode
   - Copies static assets to standalone folder
   - Uploads build artifact

2. **Deploy Job:**
   - Downloads build artifact
   - Deploys to Azure App Service using publish profile
   - Automatic deployment on push to `azure-app-service-integration` branch

### Environment Variables (Azure Portal)

Required environment variables configured in Azure App Service:

```bash
# Database
DATABASE_URL="postgresql://[username]:[password]@[server].postgres.database.azure.com:5432/[database]?sslmode=require"

# Azure OpenAI
AZURE_OPENAI_RESOURCE_NAME="[your-openai-resource-name]"
AZURE_OPENAI_API_KEY="[your-azure-openai-api-key]"

# Monitoring
APPLICATIONINSIGHTS_CONNECTION_STRING="InstrumentationKey=...;IngestionEndpoint=https://..."

# App Service Configuration
WEBSITE_RUN_FROM_PACKAGE="1"
SCM_DO_BUILD_DURING_DEPLOYMENT="false"
ENABLE_ORYX_BUILD="false"
```

### Deployment Configuration

**package.json:**
- Start script: `node .next/standalone/server.js`
- Node engine: `>=20.0.0`
- pnpm engine: `>=10.0.0`

**next.config.mjs:**
- Output mode: `standalone` (optimized for Azure App Service)

**.npmrc:**
- `node-linker=hoisted` (Azure compatibility)
- `auto-install-peers=true` (dependency resolution)

### Manual Deployment

To deploy manually to Azure:

```bash
# Build the application
pnpm build

# The standalone build is created at .next/standalone/
# GitHub Actions automatically handles deployment on push
```

### Monitoring & Logs

**Application Insights Dashboard:**
- Performance metrics
- Request telemetry
- Error tracking
- Custom events

**Azure Portal Logs:**
```bash
# Stream live logs
az webapp log tail --name app-knowledge-quiz-prod --resource-group rg-knowledge-quiz-prod

# Download logs
az webapp log download --name app-knowledge-quiz-prod --resource-group rg-knowledge-quiz-prod
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT
