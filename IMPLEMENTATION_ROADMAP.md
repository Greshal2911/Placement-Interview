# Placement Interview Preparation Platform - Implementation Roadmap

## Project Overview

A placement preparation platform with OOPs and C++ concepts, interactive MCQs, code challenges (LeetCode-style), modules, and AI-powered interviews using Gemini API.

---

## Phase 1: Setup & Database Configuration (Days 1-2)

### Step 1.1: Environment Setup

- [x] `.env` file already created with database URL and Gemini API key
- [ ] Install all required dependencies in `platform/` folder
- [ ] Set up PostgreSQL database connection
- [ ] Verify Prisma setup

### Step 1.2: Database Schema Design

**File: `platform/prisma/schema.prisma`**

Define models for:

- `User` (email, name, progress tracking)
- `Module` (title, description, order)
- `Concept` (title, description, module reference)
- `Question` (text, type: MCQ|CODE, module reference)
- `MCQOption` (text, isCorrect, question reference)
- `CodeChallenge` (title, description, testcases, module reference)
- `UserProgress` (completion status, score, module reference)
- `InterviewSession` (questions, responses, score, timestamp)

### Step 1.3: Prisma Migrations

- [ ] Run `npx prisma migrate dev --name init`
- [ ] Generate Prisma Client

---

## Phase 2: Backend API Development (Days 3-5)

### Step 2.1: API Routes Structure (`platform/src/app/api/`)

```
api/
├── auth/
│   ├── register/route.ts
│   ├── login/route.ts
│   └── logout/route.ts
├── modules/
│   ├── route.ts (GET all modules)
│   └── [id]/
│       ├── route.ts (GET module details)
│       └── concepts/route.ts
├── questions/
│   ├── route.ts (GET filtered questions)
│   └── [id]/submit/route.ts
├── interviews/
│   ├── route.ts (POST create session)
│   ├── [id]/
│   │   ├── route.ts (GET session details)
│   │   └── submit/route.ts (POST submit response)
├── progress/
│   └── [userId]/route.ts
└── gemini/
    └── interview/route.ts
```

### Step 2.2: Authentication Setup

- [ ] Implement JWT-based authentication or use NextAuth.js
- [ ] Create `/api/auth/register` endpoint
- [ ] Create `/api/auth/login` endpoint
- [ ] Create middleware for protected routes

### Step 2.3: Modules & Concepts API

- [ ] `/api/modules` - GET all modules
- [ ] `/api/modules/[id]` - GET module with concepts
- [ ] Seed database with initial modules (OOPs basics, C++ fundamentals, etc.)

### Step 2.4: Questions API

- [ ] POST `/api/questions` - Create question (admin)
- [ ] GET `/api/questions` - Fetch with filters (module, type)
- [ ] POST `/api/questions/[id]/submit` - Validate MCQ/Code answers

### Step 2.5: User Progress API

- [ ] GET `/api/progress/[userId]` - Track completion
- [ ] POST `/api/progress/[userId]/update` - Update completion status

### Step 2.6: Gemini Interview Integration

- [ ] Install `@google/generative-ai` package
- [ ] Create `/api/gemini/interview` endpoint
- [ ] Implement question generation based on module + user responses
- [ ] Implement follow-up question generation
- [ ] Store interview session data

---

## Phase 3: Frontend Components (Days 6-8)

### Step 3.1: Authentication Pages

**Files: `platform/src/app/auth/`**

- [ ] Login page component
- [ ] Registration page component
- [ ] Password reset flow

### Step 3.2: Dashboard

**File: `platform/src/app/page.tsx` or `platform/src/app/dashboard/`**

- [ ] User profile widget
- [ ] Module progress cards
- [ ] Statistics dashboard

### Step 3.3: Modules & Concepts Views

**File: `platform/src/app/modules/`**

- [ ] Modules listing page
- [ ] Module details page showing concepts
- [ ] Concept detail view with description

### Step 3.4: Questions Interface

**File: `platform/src/app/practice/`**

- [ ] MCQ question component with options
- [ ] Code challenge component with editor
- [ ] Question submission and validation
- [ ] Results display component

### Step 3.5: Interview Mode

**File: `platform/src/app/interview/`**

- [ ] Interview start page
- [ ] AI question display component
- [ ] Response input component
- [ ] Interview progress tracker
- [ ] Interview results/feedback page

### Step 3.6: shadcn/ui Components Implementation

- [ ] Button, Card, Input, Dialog, Badge, Separator
- [ ] Create reusable form components
- [ ] Loading states and error states

---

## Phase 4: Feature Implementation (Days 9-12)

### Step 4.1: Module Management

- [ ] Display all modules on dashboard
- [ ] Track user progress per module
- [ ] Calculate completion percentage

### Step 4.2: Question Bank Management

- [ ] Create/Edit/Delete questions (admin functionality)
- [ ] Filter questions by module/type/difficulty
- [ ] Implement MCQ validation logic
- [ ] Code execution framework for challenges

### Step 4.3: User Progress Tracking

- [ ] Store user answers
- [ ] Calculate scores
- [ ] Show progress analytics

### Step 4.4: AI Interview System

- [ ] Generate initial questions from Gemini
- [ ] Analyze user responses
- [ ] Generate contextual follow-up questions
- [ ] Score interview performance
- [ ] Provide feedback

### Step 4.5: Code Editor Integration

- [ ] Integrate Monaco Editor or similar
- [ ] Support C++ syntax highlighting
- [ ] Implement basic code execution/validation

---

## Phase 5: Database Seeding (Day 13)

### Step 5.1: Create Seed Script

**File: `platform/prisma/seed.ts`**

Seed data for:

- Modules: OOPs Basics, Advanced OOPs, C++ Fundamentals, STL, Algorithms
- 10-15 concepts per module
- 30-50 MCQ questions per module
- 5-10 code challenges per module
- Sample interview questions

### Step 5.2: Run Seeding

- [ ] Execute `npx prisma db seed`

---

## Phase 6: UI/UX Polish (Days 14-15)

### Step 6.1: Styling

- [ ] Configure Tailwind CSS variables
- [ ] Create color theme
- [ ] Ensure responsive design (mobile, tablet, desktop)

### Step 6.2: Navigation

- [ ] Create sidebar/navbar component
- [ ] Implement navigation between modules, practice, interviews
- [ ] Add breadcrumb navigation

### Step 6.3: Accessibility

- [ ] Add ARIA labels
- [ ] Ensure keyboard navigation
- [ ] Test with screen readers

---

## Phase 7: Performance & Optimization (Days 16-17)

### Step 7.1: Database Optimization

- [ ] Add database indexes on frequently queried fields
- [ ] Optimize Prisma queries with select/include
- [ ] Implement pagination for large datasets

### Step 7.2: Frontend Optimization

- [ ] Code splitting for routes
- [ ] Image optimization
- [ ] Lazy loading for components

### Step 7.3: Caching

- [ ] Implement API response caching
- [ ] Cache Gemini responses when appropriate

---

## Phase 8: Testing & Debugging (Days 18-19)

### Step 8.1: API Testing

- [ ] Test all endpoints with Postman/Thunder Client
- [ ] Validate error handling
- [ ] Test authentication flow

### Step 8.2: Integration Testing

- [ ] Test user workflows end-to-end
- [ ] Test interview flow
- [ ] Test progress tracking

### Step 8.3: Bug Fixing

- [ ] Identify and fix issues
- [ ] Test edge cases

---

## Phase 9: Deployment Preparation (Days 20-21)

### Step 9.1: Environment Configuration

- [ ] Create production environment variables
- [ ] Set up database backup strategy

### Step 9.2: Deployment

- [ ] Deploy to Vercel (Next.js hosting)
- [ ] Configure PostgreSQL cloud database (Supabase, Railway, etc.)
- [ ] Set up monitoring and logging

### Step 9.3: Documentation

- [ ] API documentation
- [ ] User guide
- [ ] Development setup guide

---

## Key Implementation Details

### Authentication Flow

```
User Signup/Login → JWT Token → Protected Routes → API Requests
```

### Interview Flow

```
Select Module → Gemini Generates Q1 → User Answers → Gemini Evaluates & Generates Q2 → ... → Results
```

### Module Completion Flow

```
Complete All Concepts → Practice Questions (80%+) → Pass AI Interview → Module Complete
```

---

## Technology Stack Summary

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL + Prisma ORM
- **AI**: Gemini API
- **Auth**: JWT or NextAuth.js
- **Code Editor**: Monaco Editor (optional)
- **Deployment**: Vercel

---

## Priority Order

1. Database + API setup (Phase 1-2) ⭐ Start here
2. Basic UI (Phase 3)
3. Core functionality (Phase 4)
4. Database seeding (Phase 5)
5. Polish & optimization (Phase 6-7)
6. Testing (Phase 8)
7. Deployment (Phase 9)

---

## Estimated Timeline

- **Total**: ~21 days for full implementation
- **MVP**: ~10 days (Phases 1-4 minimum)
