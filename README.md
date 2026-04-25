# Revise Wise Zone 📝

Revise Wise Zone is an advanced platform designed to streamline the Data Structures and Algorithms (DSA) preparation process. It provides developers with a powerful set of tools to track progress, receive automated question suggestions from LeetCode, and manage structured revision notes.

## 🌟 Key Features

### 1. Unified Dashboard
- **Analytics at a Glance**: View your daily, weekly, and monthly progress through interactive charts.
- **Progress Tracking**: Monitor the number of questions solved across different difficulty levels (Easy, Medium, Hard).
- **Recent Activity**: Quick access to your latest solved problems and updates.

### 2. Comprehensive Question Management
- **Add & Edit Questions**: Log new problems with detailed fields including Title, Problem Statement, Topic, Difficulty, Platform, and Code.
- **Integrated Code Editor**: A built-in Monaco Editor (VS Code core) to save and review your solutions in your preferred programming language.
- **Smart Categorization**: Tag questions and filter them by difficulty, topic, or status (Solved, Pending, Revisit).

### 3. Multi-Platform Problem Lookup 🚀
- **Automated Detection**: Simply enter a question title (e.g., "Two Sum" or "Watermelon"), and the system will automatically search multiple platforms like LeetCode and Codeforces.
- **Smart Auto-fill**: Select a matching problem result to automatically fetch the difficulty, problem URL, and unique question ID directly into your tracker.
- **Platform Agnostic**: While the system helps you find questions, the manual 'Platform' selection has been removed to keep your UI clean and focused on your progress.

### 4. Personal Mastery Notebook
- **Categorized Notes**: Create structured notes for algorithms, design patterns, or specific data structures.
- **The Revision Filter**: Easily mark questions that "Need Revision" and access them instantly during your study sessions.

### 5. Public Feed & Community
- **Shared Success**: Browse public questions added by other users to discover new problems and learning resources.
- **Global Search**: Search through a shared library of DSA problems to broaden your knowledge.

---

## 🛠️ How it Works

1. **Onboarding**: Users sign up or log in via Supabase Auth. A unique profile is automatically generated to store their preferences and progress.
2. **Problem Logging**: When you solve a problem on LeetCode or any other platform, you "Add Question" in Revise Wise Zone. Use the **Auto-fill** feature to quickly pull metadata.
3. **Drafting Solutions**: Write or paste your best solution in the integrated code editor. Add explanations and time/space complexity for future reference.
4. **Revision Cycle**: As you practice, mark challenging problems for revision. The dashboard will remind you of what needs your attention most.
5. **Insights**: Use the analytics tools to visualize your consistency and identify areas of improvement.

---

## ⚙️ Technical Architecture

Revise Wise Zone is built with modern, high-performance web technologies:

- **Frontend**: React, Vite, TypeScript, Tailwind CSS.
- **Database & Auth**: Supabase (PostgreSQL with RLS).
- **Serverless**: Supabase Edge Functions (Deno) for external API integration.
- **Testing**: Vitest and React Testing Library.

For a deep dive into the engineering behind the project, see the [ARCHITECTURE.md](file:///d:/revise-wise-zone/ARCHITECTURE.md).

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- A Supabase project

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in a `.env` file:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

---

## 🤝 Contributing
Feel free to open issues or submit pull requests to help improve the Revise Wise Zone experience!
