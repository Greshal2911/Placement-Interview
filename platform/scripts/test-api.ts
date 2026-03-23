/**
 * API Test Script
 * Tests all endpoints to verify the application is working correctly
 * Run with: npm run test:api
 */

const BASE_URL = process.env.API_URL || "http://localhost:3000";
const TEST_USER_EMAIL = "test@example.com";
const TEST_USER_NAME = "Test User";
const TEST_USER_PASSWORD = "testPassword123";

interface TestResult {
  name: string;
  status: "✅ PASS" | "❌ FAIL";
  message: string;
  time: number;
}

const results: TestResult[] = [];

async function test(
  name: string,
  fn: () => Promise<any>
): Promise<void> {
  const startTime = Date.now();
  try {
    await fn();
    const time = Date.now() - startTime;
    results.push({
      name,
      status: "✅ PASS",
      message: "Success",
      time,
    });
    console.log(`✅ ${name} (${time}ms)`);
  } catch (error: any) {
    const time = Date.now() - startTime;
    results.push({
      name,
      status: "❌ FAIL",
      message: error.message,
      time,
    });
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
  }
}

async function testAuth() {
  console.log("\n🔐 Testing Authentication...");

  let userId: string = "";

  // Test Register
  await test("POST /api/auth/register", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: TEST_USER_EMAIL,
        name: TEST_USER_NAME,
        password: TEST_USER_PASSWORD,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(`Status ${res.status}: ${error.message}`);
    }

    const data = await res.json();
    if (!data.success) throw new Error("Registration failed");
    userId = data.data.id;
  });

  // Test Login
  await test("POST /api/auth/login", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(`Status ${res.status}: ${error.message}`);
    }

    const data = await res.json();
    if (!data.success) throw new Error("Login failed");
  });

  return userId;
}

async function testModules(userId: string) {
  console.log("\n📚 Testing Modules...");

  let moduleId: string = "";

  // Test Get All Modules
  await test("GET /api/modules", async () => {
    const res = await fetch(`${BASE_URL}/api/modules`);

    if (!res.ok) {
      const error = await res.json();
      throw new Error(`Status ${res.status}: ${error.message}`);
    }

    const data = await res.json();
    if (!data.success || !Array.isArray(data.data)) {
      throw new Error("Failed to fetch modules");
    }
    if (data.data.length === 0) {
      throw new Error("No modules found - run seed script first");
    }
    moduleId = data.data[0].id;
  });

  // Test Get Module Details
  await test("GET /api/modules/[id]", async () => {
    const res = await fetch(`${BASE_URL}/api/modules/${moduleId}`);

    if (!res.ok) {
      const error = await res.json();
      throw new Error(`Status ${res.status}: ${error.message}`);
    }

    const data = await res.json();
    if (!data.success) throw new Error("Failed to fetch module details");
  });

  return moduleId;
}

async function testQuestions(moduleId: string, userId: string) {
  console.log("\n❓ Testing Questions...");

  let questionId: string = "";

  // Test Get Questions
  await test("GET /api/questions", async () => {
    const url = new URL("/api/questions", BASE_URL);
    url.searchParams.append("moduleId", moduleId);

    const res = await fetch(url);

    if (!res.ok) {
      const error = await res.json();
      throw new Error(`Status ${res.status}: ${error.message}`);
    }

    const data = await res.json();
    if (!data.success || !Array.isArray(data.data)) {
      throw new Error("Failed to fetch questions");
    }
    if (data.data.length === 0) {
      throw new Error("No questions found");
    }
    questionId = data.data[0].id;
  });

  // Test Submit MCQ Answer
  await test("POST /api/questions/[id]/submit (MCQ)", async () => {
    const res = await fetch(`${BASE_URL}/api/questions/${questionId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        selectedOption: "option-1",
      }),
    });

    if (!res.ok && res.status !== 404) {
      const error = await res.json();
      throw new Error(`Status ${res.status}: ${error.message}`);
    }

    const data = await res.json();
    if (!data.success) throw new Error("Failed to submit answer");
  });
}

async function testProgress(userId: string) {
  console.log("\n📊 Testing Progress...");

  // Test Get Progress
  await test("GET /api/progress/[userId]", async () => {
    const res = await fetch(`${BASE_URL}/api/progress/${userId}`);

    if (!res.ok) {
      const error = await res.json();
      throw new Error(`Status ${res.status}: ${error.message}`);
    }

    const data = await res.json();
    if (!data.success) throw new Error("Failed to fetch progress");
  });
}

async function testInterviews(userId: string, moduleId: string) {
  console.log("\n🎙️ Testing Interviews...");

  // First, let's get some questions answered to meet the requirement
  await test("Prepare for interview (answer questions)", async () => {
    const url = new URL("/api/questions", BASE_URL);
    url.searchParams.append("moduleId", moduleId);

    const res = await fetch(url);
    const data = await res.json();
    const questions = data.data || [];

    if (questions.length === 0) {
      throw new Error("No questions to answer");
    }

    // Answer first 3 questions
    for (let i = 0; i < Math.min(3, questions.length); i++) {
      const q = questions[i];
      const submitRes = await fetch(
        `${BASE_URL}/api/questions/${q.id}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            selectedOption: q.mcqOptions?.[0]?.id || "option-1",
          }),
        }
      );

      if (!submitRes.ok) {
        throw new Error(`Failed to answer question ${i + 1}`);
      }
    }
  });

  let interviewId: string = "";

  // Test Start Interview
  await test("POST /api/interviews (Start Interview)", async () => {
    const res = await fetch(`${BASE_URL}/api/interviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        moduleId,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(`Status ${res.status}: ${error.message}`);
    }

    const data = await res.json();
    if (!data.success) throw new Error("Failed to start interview");
    interviewId = data.data.interviewId;

    if (!interviewId) {
      throw new Error("No interview ID returned");
    }
  });

  // Test Get Interviews
  await test("GET /api/interviews", async () => {
    const url = new URL("/api/interviews", BASE_URL);
    url.searchParams.append("userId", userId);

    const res = await fetch(url);

    if (!res.ok) {
      const error = await res.json();
      throw new Error(`Status ${res.status}: ${error.message}`);
    }

    const data = await res.json();
    if (!data.success) throw new Error("Failed to fetch interviews");
  });

  // Test Get Interview Details
  if (interviewId) {
    await test("GET /api/interviews/[id]", async () => {
      const res = await fetch(`${BASE_URL}/api/interviews/${interviewId}`);

      if (!res.ok) {
        const error = await res.json();
        throw new Error(`Status ${res.status}: ${error.message}`);
      }

      const data = await res.json();
      if (!data.success) throw new Error("Failed to fetch interview details");
    });

    // Test Submit Interview Response
    await test("POST /api/interviews/[id]/submit", async () => {
      const res = await fetch(
        `${BASE_URL}/api/interviews/${interviewId}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionIndex: 0,
            userResponse:
              "This is a test response to the interview question.",
          }),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(`Status ${res.status}: ${error.message}`);
      }

      const data = await res.json();
      if (!data.success) throw new Error("Failed to submit interview response");
    });
  }
}

async function printReport() {
  console.log("\n\n" + "=".repeat(60));
  console.log("TEST REPORT");
  console.log("=".repeat(60));

  const passed = results.filter((r) => r.status === "✅ PASS").length;
  const failed = results.filter((r) => r.status === "❌ FAIL").length;
  const total = results.length;
  const totalTime = results.reduce((sum, r) => sum + r.time, 0);

  console.log(`\n📊 Summary:`);
  console.log(`   Total Tests: ${total}`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   ⏱️  Total Time: ${totalTime}ms`);

  console.log(`\n📋 Details:`);
  console.log("-".repeat(60));

  results.forEach((result) => {
    console.log(`${result.status} | ${result.name}`);
    if (result.status === "❌ FAIL") {
      console.log(`   └─ ${result.message}`);
    }
  });

  console.log("-".repeat(60));

  if (failed === 0) {
    console.log("\n✨ All tests passed! Your API is working correctly. ✨\n");
  } else {
    console.log(
      `\n⚠️  ${failed} test(s) failed. Please check the errors above.\n`
    );
  }
}

async function runAllTests() {
  console.log("🚀 Starting API Tests...\n");
  console.log(`Base URL: ${BASE_URL}\n`);

  try {
    // Test auth flow
    const userId = await testAuth();

    // Test modules
    const moduleId = await testModules(userId);

    // Test questions
    await testQuestions(moduleId, userId);

    // Test progress
    await testProgress(userId);

    // Test interviews
    await testInterviews(userId, moduleId);

    // Print report
    await printReport();
  } catch (error) {
    console.error("\n💥 Fatal error:", error);
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(console.error);
