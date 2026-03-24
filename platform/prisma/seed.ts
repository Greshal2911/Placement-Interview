import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL must be provided");
}

const prisma = new PrismaClient({
  log: ["error", "info"],
  adapter: new PrismaNeon({ connectionString: databaseUrl }),
});

type SeedModule = {
  key: string;
  title: string;
  description: string;
  order: number;
  concepts: Array<{ title: string; description: string }>;
};

type SeedCodeQuestion = {
  moduleKey: string;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  order: number;
  language: string;
  boilerplate: string;
  testCases: Array<{ input: string; output: string; visible: boolean }>;
};

const dsaModules: SeedModule[] = [
  {
    key: "arrays-strings",
    title: "Arrays and Strings",
    description:
      "Core array and string patterns including two pointers and sliding windows",
    order: 1,
    concepts: [
      { title: "Two Pointers", description: "Left-right pointer movement patterns" },
      { title: "Sliding Window", description: "Maintain dynamic ranges efficiently" },
    ],
  },
  {
    key: "linked-stack-queue",
    title: "Linked List Stack Queue",
    description:
      "Pointer-heavy linked list operations and stack/queue simulation problems",
    order: 2,
    concepts: [
      { title: "Linked List Basics", description: "Node insertions and traversals" },
      { title: "Stack Applications", description: "Expression and bracket handling" },
    ],
  },
  {
    key: "hashing-maps",
    title: "Hashing Maps Sets",
    description:
      "Frequency tables, hashmap lookups, and constant-time set membership",
    order: 3,
    concepts: [
      { title: "Frequency Count", description: "Count items in linear time" },
      { title: "Hashmap Lookup", description: "Fast value retrieval strategies" },
    ],
  },
  {
    key: "binary-search",
    title: "Binary Search Patterns",
    description: "Search in sorted spaces and answer-space binary search",
    order: 4,
    concepts: [
      { title: "Lower Bound", description: "Find first valid index" },
      { title: "Answer Search", description: "Binary search on feasibility" },
    ],
  },
  {
    key: "trees-bst-heaps",
    title: "Trees BST Heaps",
    description: "Tree traversals, BST properties, and heap based selection",
    order: 5,
    concepts: [
      { title: "BST Invariants", description: "Ordering constraints in BST" },
      { title: "Heap Operations", description: "Top-k and priority workflows" },
    ],
  },
  {
    key: "backtracking-recursion",
    title: "Recursion Backtracking",
    description: "Depth-first exploration with pruning and recursive decomposition",
    order: 6,
    concepts: [
      { title: "Recursion Trees", description: "Understand branching calls" },
      { title: "Backtracking", description: "Choose, explore, unchoose pattern" },
    ],
  },
  {
    key: "graphs",
    title: "Graph Algorithms",
    description: "Components, traversal, shortest path, and graph modeling",
    order: 7,
    concepts: [
      { title: "BFS and DFS", description: "Core graph traversal methods" },
      { title: "Connected Components", description: "Count disconnected groups" },
    ],
  },
  {
    key: "dp",
    title: "Dynamic Programming",
    description: "Memoization and tabulation for optimal substructure problems",
    order: 8,
    concepts: [
      { title: "1D DP", description: "Linear recurrence patterns" },
      { title: "State Transition", description: "Define and optimize DP states" },
    ],
  },
];

const dsaCodeQuestions: SeedCodeQuestion[] = [
  {
    moduleKey: "arrays-strings",
    title: "Array Maximum Element",
    description: "Given an array, print the maximum element",
    difficulty: "Easy",
    order: 1,
    language: "cpp",
    boilerplate: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    // Write your code here
    return 0;
}`,
    testCases: [
      { input: "5\n3 9 1 7 4", output: "9", visible: true },
      { input: "4\n-5 -2 -10 -1", output: "-1", visible: true },
      { input: "1\n42", output: "42", visible: false },
    ],
  },
  {
    moduleKey: "linked-stack-queue",
    title: "Valid Parentheses Using Stack",
    description: "Check if a bracket string is balanced using stack logic",
    difficulty: "Medium",
    order: 1,
    language: "cpp",
    boilerplate: `#include <iostream>
#include <stack>
#include <string>
using namespace std;

int main() {
    string s;
    cin >> s;
    // Write your code here
    return 0;
}`,
    testCases: [
      { input: "()[]{}", output: "YES", visible: true },
      { input: "([)]", output: "NO", visible: true },
      { input: "{[()()]}", output: "YES", visible: false },
    ],
  },
  {
    moduleKey: "hashing-maps",
    title: "Frequency in Hash Map",
    description: "Count frequency of x in an array using map/hash table",
    difficulty: "Easy",
    order: 1,
    language: "cpp",
    boilerplate: `#include <iostream>
#include <unordered_map>
using namespace std;

int main() {
    int n;
    cin >> n;
    int x;
    unordered_map<int, int> freq;
    for (int i = 0; i < n; i++) {
        int value;
        cin >> value;
        freq[value]++;
    }
    cin >> x;
    // Write your code here
    return 0;
}`,
    testCases: [
      { input: "6\n1 2 2 3 2 4\n2", output: "3", visible: true },
      { input: "5\n5 5 5 5 5\n1", output: "0", visible: true },
      { input: "4\n9 8 7 6\n9", output: "1", visible: false },
    ],
  },
  {
    moduleKey: "binary-search",
    title: "First Occurrence Binary Search",
    description: "Find first occurrence index of x in sorted array, else print -1",
    difficulty: "Medium",
    order: 1,
    language: "cpp",
    boilerplate: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    int x;
    cin >> x;
    // Write your code here
    return 0;
}`,
    testCases: [
      { input: "7\n1 2 2 2 3 4 5\n2", output: "1", visible: true },
      { input: "5\n1 3 5 7 9\n4", output: "-1", visible: true },
      { input: "6\n2 2 2 2 2 2\n2", output: "0", visible: false },
    ],
  },
  {
    moduleKey: "trees-bst-heaps",
    title: "Kth Largest with Heap",
    description: "Find kth largest element in array using heap approach",
    difficulty: "Medium",
    order: 1,
    language: "cpp",
    boilerplate: `#include <iostream>
#include <vector>
#include <queue>
using namespace std;

int main() {
    int n, k;
    cin >> n >> k;
    vector<int> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    // Write your code here
    return 0;
}`,
    testCases: [
      { input: "6 2\n3 1 5 12 2 11", output: "11", visible: true },
      { input: "5 3\n5 12 11 -1 12", output: "11", visible: true },
      { input: "4 1\n9 8 7 6", output: "9", visible: false },
    ],
  },
  {
    moduleKey: "backtracking-recursion",
    title: "Nth Fibonacci Recursion",
    description: "Return nth Fibonacci number using recursion with memoization",
    difficulty: "Medium",
    order: 1,
    language: "cpp",
    boilerplate: `#include <iostream>
#include <vector>
using namespace std;

long long fib(int n, vector<long long>& memo) {
    // Write your code here
    return 0;
}

int main() {
    int n;
    cin >> n;
    vector<long long> memo(n + 1, -1);
    cout << fib(n, memo);
    return 0;
}`,
    testCases: [
      { input: "5", output: "5", visible: true },
      { input: "10", output: "55", visible: true },
      { input: "1", output: "1", visible: false },
    ],
  },
  {
    moduleKey: "graphs",
    title: "Count Graph Components",
    description:
      "Given an undirected graph, count connected components using DFS or BFS",
    difficulty: "Medium",
    order: 1,
    language: "cpp",
    boilerplate: `#include <iostream>
#include <vector>
using namespace std;

void dfs(int node, vector<vector<int>>& graph, vector<int>& visited) {
    // Write your code here
}

int main() {
    int n, m;
    cin >> n >> m;
    vector<vector<int>> graph(n + 1);
    for (int i = 0; i < m; i++) {
        int u, v;
        cin >> u >> v;
        graph[u].push_back(v);
        graph[v].push_back(u);
    }
    // Write your code here
    return 0;
}`,
    testCases: [
      { input: "5 3\n1 2\n2 3\n4 5", output: "2", visible: true },
      { input: "4 0", output: "4", visible: true },
      { input: "6 5\n1 2\n2 3\n3 1\n4 5\n5 6", output: "2", visible: false },
    ],
  },
  {
    moduleKey: "dp",
    title: "Climbing Stairs DP",
    description: "Count distinct ways to reach step n if you can climb 1 or 2 steps",
    difficulty: "Easy",
    order: 1,
    language: "cpp",
    boilerplate: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    // Write your code here
    return 0;
}`,
    testCases: [
      { input: "2", output: "2", visible: true },
      { input: "5", output: "8", visible: true },
      { input: "7", output: "21", visible: false },
    ],
  },
];

async function createCodeQuestion(
  moduleId: string,
  question: Omit<SeedCodeQuestion, "moduleKey">,
) {
  await prisma.question.create({
    data: {
      title: question.title,
      description: question.description,
      type: "CODE",
      difficulty: question.difficulty,
      moduleId,
      order: question.order,
      codeChallenge: {
        create: {
          title: question.title,
          language: question.language,
          boilerplate: question.boilerplate,
          testCases: question.testCases,
        },
      },
    },
  });
}

async function main() {
  console.log("Starting database seed...");

  // Clear existing data
  await prisma.userAnswer.deleteMany();
  await prisma.codeChallenge.deleteMany();
  await prisma.mCQOption.deleteMany();
  await prisma.question.deleteMany();
  await prisma.interview.deleteMany();
  await prisma.moduleProgress.deleteMany();
  await prisma.progress.deleteMany();
  await prisma.concept.deleteMany();
  await prisma.module.deleteMany();
  await prisma.user.deleteMany();

  console.log("Cleared existing data");

  const moduleMap = new Map<string, string>();

  for (const seedModule of dsaModules) {
    const createdModule = await prisma.module.create({
      data: {
        title: seedModule.title,
        description: seedModule.description,
        order: seedModule.order,
      },
    });

    moduleMap.set(seedModule.key, createdModule.id);

    for (let i = 0; i < seedModule.concepts.length; i++) {
      const concept = seedModule.concepts[i];
      await prisma.concept.create({
        data: {
          title: concept.title,
          description: concept.description,
          content: `Notes for ${concept.title}`,
          order: i + 1,
          moduleId: createdModule.id,
        },
      });
    }
  }

  console.log(`Created ${dsaModules.length} DSA modules with concepts`);

  for (const question of dsaCodeQuestions) {
    const moduleId = moduleMap.get(question.moduleKey);
    if (!moduleId) {
      throw new Error(`Module not found for key: ${question.moduleKey}`);
    }

    await createCodeQuestion(moduleId, {
      title: question.title,
      description: question.description,
      difficulty: question.difficulty,
      order: question.order,
      language: question.language,
      boilerplate: question.boilerplate,
      testCases: question.testCases,
    });
  }

  console.log(`Created ${dsaCodeQuestions.length} DSA coding challenges`);

  // Create a sample user
  const user = await prisma.user.create({
    data: {
      email: "student@example.com",
      name: "John Doe",
      password: "hashed_password_here", // In production, hash this
      role: "student",
    },
  });

  console.log("Created sample user");

  for (const moduleId of moduleMap.values()) {
    await prisma.moduleProgress.create({
      data: {
        userId: user.id,
        moduleId,
        completed: false,
        score: 0,
      },
    });
  }

  console.log("Created module progress entries");

  // Create overall progress
  await prisma.progress.create({
    data: {
      userId: user.id,
      totalQuestionsAttempted: 0,
      totalCorrect: 0,
      overallScore: 0,
    },
  });

  console.log("Created overall progress");

  console.log("Seed completed successfully");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
