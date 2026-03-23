import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Clear existing data
  await prisma.userAnswer.deleteMany();
  await prisma.codeChallenge.deleteMany();
  await prisma.mcqOption.deleteMany();
  await prisma.question.deleteMany();
  await prisma.interview.deleteMany();
  await prisma.moduleProgress.deleteMany();
  await prisma.progress.deleteMany();
  await prisma.concept.deleteMany();
  await prisma.module.deleteMany();
  await prisma.user.deleteMany();

  console.log("✅ Cleared existing data");

  // Create Modules
  const module1 = await prisma.module.create({
    data: {
      title: "OOPs Fundamentals",
      description: "Learn Object-Oriented Programming basics including classes, objects, and principles",
      order: 1,
    },
  });

  const module2 = await prisma.module.create({
    data: {
      title: "C++ Basics",
      description: "Master C++ fundamentals including syntax, data types, and control flow",
      order: 2,
    },
  });

  const module3 = await prisma.module.create({
    data: {
      title: "Advanced OOPs",
      description: "Deep dive into inheritance, polymorphism, interfaces, and design patterns",
      order: 3,
    },
  });

  console.log("✅ Created 3 modules");

  // Create Concepts for OOPs Fundamentals
  const oopsConepts = [
    { title: "Classes and Objects", description: "Understanding blueprint and instances" },
    { title: "Encapsulation", description: "Data hiding and access control" },
    { title: "Abstraction", description: "Hiding implementation details" },
  ];

  for (let i = 0; i < oopsConepts.length; i++) {
    await prisma.concept.create({
      data: {
        title: oopsConepts[i].title,
        description: oopsConepts[i].description,
        content: `Detailed content about ${oopsConepts[i].title}...`,
        order: i + 1,
        moduleId: module1.id,
      },
    });
  }

  // Create Concepts for C++ Basics
  const cppConcepts = [
    { title: "Variables and Data Types", description: "Learn about int, float, char, etc." },
    { title: "Loops and Conditionals", description: "for, while, if-else statements" },
    { title: "Functions", description: "Function declaration, definition, and calls" },
  ];

  for (let i = 0; i < cppConcepts.length; i++) {
    await prisma.concept.create({
      data: {
        title: cppConcepts[i].title,
        description: cppConcepts[i].description,
        content: `Detailed content about ${cppConcepts[i].title}...`,
        order: i + 1,
        moduleId: module2.id,
      },
    });
  }

  console.log("✅ Created concepts");

  // Create MCQ Questions for OOPs
  const mcqQuestion1 = await prisma.question.create({
    data: {
      title: "What is a class?",
      description: "Select the correct definition of a class",
      type: "MCQ",
      difficulty: "Easy",
      moduleId: module1.id,
      order: 1,
      mcqOptions: {
        create: [
          { text: "A blueprint for creating objects", isCorrect: true, order: 1 },
          { text: "An instance of an object", isCorrect: false, order: 2 },
          { text: "A function in programming", isCorrect: false, order: 3 },
          { text: "A module", isCorrect: false, order: 4 },
        ],
      },
    },
    include: { mcqOptions: true },
  });

  const mcqQuestion2 = await prisma.question.create({
    data: {
      title: "What is encapsulation?",
      description: "Choose the best description",
      type: "MCQ",
      difficulty: "Medium",
      moduleId: module1.id,
      order: 2,
      mcqOptions: {
        create: [
          { text: "Hiding internal implementation details", isCorrect: true, order: 1 },
          { text: "Deleting unnecessary code", isCorrect: false, order: 2 },
          { text: "Writing comments", isCorrect: false, order: 3 },
          { text: "Using loops", isCorrect: false, order: 4 },
        ],
      },
    },
    include: { mcqOptions: true },
  });

  console.log("✅ Created MCQ questions");

  // Create Code Challenge Questions for C++
  const codeQuestion1 = await prisma.question.create({
    data: {
      title: "Sum of Two Numbers",
      description: "Write a C++ program to find the sum of two numbers",
      type: "CODE",
      difficulty: "Easy",
      moduleId: module2.id,
      order: 1,
      codeChallenge: {
        create: {
          title: "Sum of Two Numbers",
          language: "cpp",
          boilerplate: `#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    // Write your code here
    return 0;
}`,
          testCases: [
            { input: "5 3", output: "8", visible: true },
            { input: "10 20", output: "30", visible: true },
            { input: "-5 5", output: "0", visible: false },
          ],
        },
      },
    },
  });

  const codeQuestion2 = await prisma.question.create({
    data: {
      title: "Check Prime Number",
      description: "Write a C++ program to check if a number is prime",
      type: "CODE",
      difficulty: "Medium",
      moduleId: module2.id,
      order: 2,
      codeChallenge: {
        create: {
          title: "Check Prime Number",
          language: "cpp",
          boilerplate: `#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    // Write your code here
    return 0;
}`,
          testCases: [
            { input: "7", output: "yes", visible: true },
            { input: "10", output: "no", visible: true },
            { input: "2", output: "yes", visible: false },
          ],
        },
      },
    },
  });

  console.log("✅ Created Code Challenge questions");

  // Create a sample user
  const user = await prisma.user.create({
    data: {
      email: "student@example.com",
      name: "John Doe",
      password: "hashed_password_here", // In production, hash this
      role: "student",
    },
  });

  console.log("✅ Created sample user");

  // Create module progress for user
  await prisma.moduleProgress.create({
    data: {
      userId: user.id,
      moduleId: module1.id,
      completed: false,
      score: 0,
    },
  });

  await prisma.moduleProgress.create({
    data: {
      userId: user.id,
      moduleId: module2.id,
      completed: false,
      score: 0,
    },
  });

  console.log("✅ Created module progress");

  // Create overall progress
  await prisma.progress.create({
    data: {
      userId: user.id,
      totalQuestionsAttempted: 0,
      totalCorrect: 0,
      overallScore: 0,
    },
  });

  console.log("✅ Created overall progress");

  console.log("✨ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
