# Quick Start Guide - Placement Interview Platform

## Prerequisites

- Node.js (v18+)
- PostgreSQL database
- Gemini API Key

---

## 🚀 Step 1: Environment Setup

### 1.1 Configure Environment Variables

Edit `platform/.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/placement_interview"

# Gemini API
GEMINI_API_KEY="your_gemini_api_key_here"

# NextAuth (optional)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_secret_key_here"

NODE_ENV="development"
```

### 1.2 Install Dependencies

```bash
cd platform
npm install
```

---

## 🗄️ Step 2: Database Setup

### 2.1 Create Database

```bash
# Create PostgreSQL database
createdb placement_interview
```

### 2.2 Run Prisma Migrations

```bash
npm run prisma:migrate
# or
npm run db:push
```

### 2.3 Seed Sample Data

```bash
npm run prisma:seed
# or
npm run db:seed
```

---

## ▶️ Step 3: Start Development Server

```bash
npm run dev
```

The application will be available at: **http://localhost:3000**

---

## ✅ Step 4: Test the Application

### 4.1 Run API Tests

```bash
# In a new terminal, from the platform directory
npm run test:api
```

This will:

- ✅ Test user registration
- ✅ Test user login
- ✅ Test module fetching
- ✅ Test questions retrieval
- ✅ Test answer submission
- ✅ Test progress tracking
- ✅ Test interview creation
- ✅ Test interview responses

### 4.2 Manual Testing

#### Access Dashboard

- Open http://localhost:3000
- Automatically redirects to http://localhost:3000/dashboard

#### Test Pages

**🏠 Dashboard** (`/dashboard`)

- View overall stats
- See module progress
- Quick action cards

**📚 Modules** (`/modules`)

- View all modules
- See concepts for each module
- Click to expand module details

**❓ Practice** (`/practice?moduleId=<id>`)

- Answer MCQ questions
- View code challenges
- Get instant feedback

**🎙️ Interview** (`/interview`)

- Select a module
- Answer AI-generated questions
- Get Gemini-powered evaluation
- View final score

---

## 🔍 Common Issues & Solutions

### Issue: `DATABASE_URL is not set`

**Solution:** Ensure `.env` file exists with `DATABASE_URL` configured

### Issue: Prisma migrate fails

**Solution:**

1. Delete existing migrations in `prisma/migrations/`
2. Run `npm run db:push` instead

### Issue: No modules appear

**Solution:**

1. Run `npm run db:seed` to populate sample data
2. Check if seed script completed successfully

### Issue: Gemini API calls fail

**Solution:**

1. Verify `GEMINI_API_KEY` is correct
2. Check API key has permissions
3. Monitor Gemini API usage limits

### Issue: Server won't start

**Solution:**

```bash
# Clear next cache and rebuild
rm -rf .next
npm run build
npm run dev
```

---

## 📊 Testing Workflow

```
1. Start Server
   npm run dev

2. Run API Tests (in new terminal)
   npm run test:api

3. Open in Browser
   http://localhost:3000

4. Test Manual Flows
   - Dashboard → Modules → Practice → Interview
```

---

## 📁 Project Structure

```
platform/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed script
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── dashboard/     # Dashboard page
│   │   ├── modules/       # Modules page
│   │   ├── practice/      # Practice page
│   │   └── interview/     # Interview page
│   ├── components/
│   │   ├── shared/        # Shared components
│   │   └── ui/            # shadcn/ui components
│   └── lib/
│       ├── prisma.ts      # Prisma client
│       ├── api-response.ts# Response helpers
│       └── gemini.ts      # Gemini integration
├── scripts/
│   └── test-api.ts        # API test script
└── package.json           # Dependencies & scripts
```

---

## 🔤 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Modules

- `GET /api/modules` - Get all modules
- `GET /api/modules/[id]` - Get module details

### Questions

- `GET /api/questions` - Get questions
- `POST /api/questions` - Create question
- `POST /api/questions/[id]/submit` - Submit answer

### Progress

- `GET /api/progress/[userId]` - Get user progress
- `PUT /api/progress/[userId]` - Update progress

### Interviews

- `POST /api/interviews` - Start interview
- `GET /api/interviews` - Get interviews
- `GET /api/interviews/[id]` - Get interview details
- `POST /api/interviews/[id]/submit` - Submit response

---

## 📝 Next Steps

After successful testing:

1. ✅ Create authentication pages (login/register UI)
2. ✅ Add user session management
3. ✅ Implement code execution for challenges
4. ✅ Add analytics dashboard
5. ✅ Deploy to production

---

## 🆘 Need Help?

Check:

- Error messages in terminal
- Browser console (F12)
- Network tab (API requests)
- `.env` file configuration
- Database connectivity

---

**Happy Testing! 🎉**
