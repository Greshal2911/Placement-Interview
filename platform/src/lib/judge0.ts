type Judge0Status = {
  id: number;
  description: string;
};

export type CodeTestCase = {
  input: string;
  output: string;
  visible?: boolean;
};

export type TestCaseExecutionResult = {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  status: Judge0Status;
  stderr?: string;
  compileOutput?: string;
  runtimeError?: string;
  time?: string;
  memory?: number;
};

export type Judge0EvaluationResult = {
  allPassed: boolean;
  passedCount: number;
  totalCount: number;
  testResults: TestCaseExecutionResult[];
};

type Judge0SubmissionResponse = {
  status: Judge0Status;
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  message?: string | null;
  time?: string | null;
  memory?: number | null;
};

const LANGUAGE_MAP: Record<string, number> = {
  cpp: 54,
  "c++": 54,
  c: 50,
  python: 71,
  python3: 71,
  java: 62,
  javascript: 63,
  js: 63,
};

function toBase64(value: string): string {
  return Buffer.from(value, "utf8").toString("base64");
}

function fromBase64(value?: string | null): string {
  if (!value) return "";
  return Buffer.from(value, "base64").toString("utf8");
}

function normalizeOutput(value: string): string {
  return value.replace(/\r\n/g, "\n").trim();
}

function getJudge0Config() {
  const apiUrl =
    process.env.JUDGE0_API_URL?.trim() || "https://ce.judge0.com";
  const apiKey = process.env.JUDGE0_API_KEY?.trim();
  const apiHost = process.env.JUDGE0_API_HOST?.trim();

  return {
    apiUrl,
    apiKey,
    apiHost,
  };
}

function getLanguageId(language: string): number {
  const normalized = language.toLowerCase().trim();
  const languageId = LANGUAGE_MAP[normalized];

  if (!languageId) {
    throw new Error(`Unsupported language for Judge0: ${language}`);
  }

  return languageId;
}

async function runSingleSubmission(
  sourceCode: string,
  languageId: number,
  testCase: CodeTestCase,
): Promise<TestCaseExecutionResult> {
  const { apiUrl, apiKey, apiHost } = getJudge0Config();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (apiKey) {
    headers["X-RapidAPI-Key"] = apiKey;
  }

  if (apiHost) {
    headers["X-RapidAPI-Host"] = apiHost;
  }

  const response = await fetch(
    `${apiUrl}/submissions?base64_encoded=true&wait=true`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        source_code: toBase64(sourceCode),
        language_id: languageId,
        stdin: toBase64(testCase.input),
        expected_output: toBase64(testCase.output),
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Judge0 request failed (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as Judge0SubmissionResponse;
  const actualOutput = normalizeOutput(fromBase64(data.stdout));
  const expectedOutput = normalizeOutput(testCase.output);
  const stderr = fromBase64(data.stderr);
  const compileOutput = fromBase64(data.compile_output);
  const runtimeError = fromBase64(data.message);

  return {
    input: testCase.input,
    expectedOutput,
    actualOutput,
    passed: data.status?.id === 3 && actualOutput === expectedOutput,
    status: data.status,
    stderr: stderr || undefined,
    compileOutput: compileOutput || undefined,
    runtimeError: runtimeError || undefined,
    time: data.time || undefined,
    memory: data.memory || undefined,
  };
}

export async function evaluateCodeWithJudge0(
  sourceCode: string,
  language: string,
  testCases: CodeTestCase[],
): Promise<Judge0EvaluationResult> {
  if (!sourceCode.trim()) {
    throw new Error("Source code cannot be empty");
  }

  if (!testCases.length) {
    throw new Error("No test cases configured for this challenge");
  }

  const languageId = getLanguageId(language);

  const testResults = await Promise.all(
    testCases.map((testCase) =>
      runSingleSubmission(sourceCode, languageId, testCase),
    ),
  );

  const passedCount = testResults.filter((result) => result.passed).length;

  return {
    allPassed: passedCount === testCases.length,
    passedCount,
    totalCount: testCases.length,
    testResults,
  };
}