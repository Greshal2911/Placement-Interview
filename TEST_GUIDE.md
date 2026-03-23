# 🧪 How to Test the Application

## Quick Test (2 minutes)

### Terminal 1: Start the Server
```bash
cd platform
npm run dev
```

Wait for: `✓ Ready in 2.3s`

### Terminal 2: Run API Tests
```bash
cd platform
npm run test:api
```

You'll see a complete test report showing:
- ✅ All 13+ API endpoints tested
- ✅ User registration & login flows
- ✅ Module and question retrieval
- ✅ Answer submission & validation
- ✅ Progress tracking
- ✅ AI Interview generation

---

## Manual Testing (10 minutes)

### Open Application
```
http://localhost:3000
```

### 1. Dashboard Flow
```
1. Click "Continue Learning"
   ↓
2. Should show all modules listed
3. Each module shows:
   - Title & description
   - Progress bar
   - Question count
   - Status badge
```

### 2. Modules Flow
```
1. Navigate to /modules
   ↓
2. See all modules in grid
3. Click on module to expand
4. See all concepts for that module
5. Click "Start Practice"
```

### 3. Practice Questions Flow
```
1. Practice page loads with questions
   ↓
2. See MCQ question with radio options
3. Select an option
4. Click "Submit Answer"
5. Get instant feedback (✅ or ❌)
6. See score
7. Click "Next" to move to next question
```

### 4. AI Interview Flow
```
1. Click "AI Interview" 
   ↓
2. Select a module from radio options
3. Click "Start Interview"
4. AI generates interview questions
5. Type your answer
6. Click "Submit Answer"
7. See AI evaluation:
   - Your response
   - Score (0-10)
   - Feedback
8. Click "Next Question"
9. After all questions → Final Score
```

---

## Checking Results

### What to Look For ✅

**API Test Output:**
```
✅ POST /api/auth/register (45ms)
✅ POST /api/auth/login (38ms)
✅ GET /api/modules (52ms)
✅ GET /api/modules/[id] (41ms)
✅ GET /api/questions (35ms)
✅ POST /api/questions/[id]/submit (48ms)
✅ GET /api/progress/[userId] (33ms)
✅ POST /api/interviews (156ms)    ← Gemini API call
✅ GET /api/interviews (29ms)
```

**Final Report:**
```
📊 Summary:
   Total Tests: 13
   ✅ Passed: 13
   ❌ Failed: 0
   ⏱️  Total Time: 892ms
```

---

## Troubleshooting

### ❌ Test Fails: "DATABASE_URL is not set"
```bash
# Check platform/.env file exists and has:
DATABASE_URL="postgresql://..."

# Then run again
npm run test:api
```

### ❌ Test Fails: "No modules found"
```bash
# Seed database with sample data
npm run db:seed

# Then run tests again
npm run test:api
```

### ❌ Test Fails: "Gemini API error"
```bash
# Check platform/.env for:
GEMINI_API_KEY="your_actual_key"

# Verify API key is valid at: https://console.cloud.google.com
```

### ❌ Page shows "No modules found" when navigating
```
Same as above - run npm run db:seed
```

### ❌ Interview page says "Failed to start interview"
```bash
# First answer at least 3 practice questions, then try interview
# Or run tests which will prepare the data
```

---

## Testing Checklist ✅

- [ ] Server starts: `npm run dev`
- [ ] Can access: http://localhost:3000
- [ ] Dashboard loads
- [ ] All 4 stat cards visible
- [ ] 3 quick action cards visible
- [ ] Modules section loads
- [ ] Can navigate to /modules
- [ ] Can navigate to /practice
- [ ] Can answer MCQ questions
- [ ] Get feedback on submission
- [ ] Can navigate to /interview
- [ ] Can start interview after answering questions
- [ ] API tests pass: `npm run test:api`

---

## Performance Metrics

Healthy Performance:
```
API Response Times:
- Auth endpoints:    30-50ms
- Module endpoints:  35-60ms
- Question endpoints: 35-50ms
- Interview endpoints: 150-300ms (includes AI)

Total API test time: 800-1200ms
All tests should pass: 13/13
```

---

## Next Test Scenarios (After Phase 4)

```
1. Authentication Tests
   - Create account
   - Login
   - Stay logged in
   - Logout

2. User Progress Tests
   - Complete full module
   - Check progress updated
   - See certificate

3. Code Challenge Tests
   - Submit C++ code
   - See compilation results
   - Get test case feedback

4. Interview Quality Tests
   - Get follow-up questions
   - See AI evaluation accuracy
   - Check final score fairness
```

---

**You're all set! Run the tests and let me know if you hit any issues.** 🚀
