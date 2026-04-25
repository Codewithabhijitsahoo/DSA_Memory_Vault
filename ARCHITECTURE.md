# Revise Wise Zone - System Architecture

Revise Wise Zone is a feature-rich web application designed to help users track their DSA (Data Structures and Algorithms) practice, manage notes, and revise problems effectively.

## Tech Stack

### Frontend
- **Framework**: [React](https://reactjs.org/) with [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with [Shadcn UI](https://ui.shadcn.com/)
- **State Management & Data Fetching**: [Tanstack Query (React Query)](https://tanstack.com/query/latest)
- **Routing**: [React Router Dom](https://reactrouter.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Code Editor**: [Monaco Editor](https://microsoft.github.io/monaco-editor/) (via `@monaco-editor/react`)
- **Testing**: [Vitest](https://vitest.dev/) with [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

### Backend (BaaS)
- **Platform**: [Supabase](https://supabase.com/)
- **Database**: PostgreSQL
- **Authentication**: Supabase Auth (Email/Password, Social)
- **Edge Functions**: Deno-based serverless functions for external API integrations (e.g., LeetCode lookup)
- **Storage**: Supabase Storage for assets (if any)

## Project Structure

```text
/
├── src/
│   ├── components/       # Reusable UI components (AppLayout, Sidebar, etc.)
│   │   └── ui/           # Shadcn UI base components
│   ├── hooks/            # Custom React hooks (useAuth, useTheme, etc.)
│   ├── integrations/     # Third-party service integrations (Supabase client)
│   ├── pages/            # Top-level page components (Dashboard, MyQuestions, etc.)
│   ├── test/             # Test files and setup
│   ├── App.tsx           # Main App component with routing and providers
│   └── main.tsx          # Application entry point
├── supabase/
│   ├── functions/        # Supabase Edge Functions (e.g., leetcode-lookup)
│   ├── migrations/       # SQL migration files for database schema
│   └── config.toml       # Supabase configuration
├── public/               # Static assets
├── tailwind.config.ts    # Tailwind CSS configuration
├── vite.config.ts        # Vite configuration
└── vitest.config.ts      # Vitest configuration
```

## Database Schema

### `public.profiles`
- Extends `auth.users` with additional metadata.
- Automatically created via a PostgreSQL trigger on user signup.
- Contains `display_name`, `avatar_url`, and timestamps.

### `public.questions`
- Stores DSA questions added by users.
- Fields: `title`, `problem_statement`, `topic`, `difficulty`, `platform`, `problem_link`, `answer`, `explanation`, `code`, `language`, `status`, `is_favorite`, `needs_revision`, `tags`.
- Uses Row Level Security (RLS) to ensure users only see their own questions.

### `public.notes`
- Stores personal notes created by users.
- Fields: `title`, `content`, `category`.
- Uses RLS for data isolation.

## Key Features & Logic

### 1. Authentication Flow
- Handled by `src/hooks/useAuth.tsx` and `src/components/ProtectedRoute.tsx`.
- Uses Supabase Auth to manage user sessions.
- `AuthProvider` wraps the application to provide user context.

### 2. Multi-Platform Integration
- A unified Edge Function (`supabase/functions/problem-lookup`) interacts with various platform APIs (LeetCode GraphQL, Codeforces API, etc.).
- Allows users to search for questions by title and auto-fill details across multiple coding sites simultaneously.
- Uses algorithmic similarity scoring to suggest the best matches.

### 3. Study Tracking (Practice Tracker)
- Tracks user practice counts for questions.
- Integrated into pages like `PublicFeed`, `MyQuestions`, and `PublicQuestion`.

### 4. Revision System
- Filterable views for questions that "need revision".
- Categorization by difficulty and topic to help focused study sessions.

## Deployment & Environments
- **Hosting**: Typically deployed on platforms like Vercel or Netlify.
- **Database**: Hosted on Supabase.
- **Environment Variables**: Managed via `.env` file (e.g., `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`).
