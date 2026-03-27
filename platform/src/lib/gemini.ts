import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not set");
}

const genAI = new GoogleGenerativeAI(apiKey);

const defaultModels = [
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-pro",
];

const configuredModels = (process.env.GEMINI_MODEL_CANDIDATES || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const modelCandidates = configuredModels.length ? configuredModels : defaultModels;

let discoveredModelsCache: string[] | null = null;
let discoveryInFlight: Promise<string[]> | null = null;

type ListModelsResponse = {
  models?: Array<{
    name?: string;
    supportedGenerationMethods?: string[];
  }>;
};

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

async function discoverGenerateContentModels(): Promise<string[]> {
  if (discoveredModelsCache) {
    return discoveredModelsCache;
  }

  if (discoveryInFlight) {
    return discoveryInFlight;
  }

  discoveryInFlight = (async () => {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
        { method: "GET", cache: "no-store" },
      );

      if (!response.ok) {
        throw new Error(`List models request failed: ${response.status} ${response.statusText}`);
      }

      const payload = (await response.json()) as ListModelsResponse;
      const discovered = (payload.models || [])
        .filter((model) => model.supportedGenerationMethods?.includes("generateContent"))
        .map((model) => model.name || "")
        .filter(Boolean)
        .map((name) => name.replace(/^models\//, ""));

      discoveredModelsCache = uniqueStrings(discovered);
      return discoveredModelsCache;
    } catch (error) {
      console.warn("Could not discover Gemini models dynamically:", error);
      discoveredModelsCache = [];
      return discoveredModelsCache;
    } finally {
      discoveryInFlight = null;
    }
  })();

  return discoveryInFlight;
}

async function getRuntimeModelCandidates(): Promise<string[]> {
  const discovered = await discoverGenerateContentModels();
  const priority = uniqueStrings([...modelCandidates, ...discovered]);

  const discoveredSet = new Set(discovered);
  const preferred = priority.filter((name) => discoveredSet.has(name));

  // If discovery worked, prefer only verified model IDs to avoid 404 spam.
  if (preferred.length > 0) {
    return preferred;
  }

  return priority;
}

function extractJsonArray(text: string) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Could not parse JSON array from model response");
  }
  return JSON.parse(jsonMatch[0]);
}

function extractJsonObject(text: string) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not parse JSON object from model response");
  }
  return JSON.parse(jsonMatch[0]);
}

async function generateTextWithModelFallback(prompt: string): Promise<string> {
  let lastError: unknown;

  const runtimeCandidates = await getRuntimeModelCandidates();

  for (const modelName of runtimeCandidates) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      lastError = error;
      console.warn(`Gemini model '${modelName}' failed. Trying next candidate.`);
    }
  }

  throw lastError ?? new Error("No Gemini models available for generateContent");
}

function buildFallbackQuestions(module: string, concepts: string[], count: number): InterviewQuestion[] {
  const baseConcepts = concepts.length ? concepts : [module];

  return Array.from({ length: count }, (_, index) => {
    const concept = baseConcepts[index % baseConcepts.length];
    return {
      question: `Explain the core idea of ${concept} and give one practical use case in ${module}.`,
    };
  });
}

interface InterviewQuestion {
  question: string;
  expectedAnswer?: string;
}

export async function generateInterviewQuestions(
  module: string,
  concepts: string[],
  count: number = 5
): Promise<InterviewQuestion[]> {
  try {
    const prompt = `Generate ${count} technical interview questions for a ${module} module covering these concepts: ${concepts.join(", ")}. 
    
    Format each question as JSON with "question" field. Return only valid JSON array.
    Example: [{"question": "What is object-oriented programming?"}, ...]`;

    const responseText = await generateTextWithModelFallback(prompt);
    const questions = extractJsonArray(responseText) as InterviewQuestion[];
    return questions.filter((item) => typeof item?.question === "string" && item.question.trim()).slice(0, count);
  } catch (error) {
    console.error("Error generating questions:", error);
    return buildFallbackQuestions(module, concepts, count);
  }
}

export async function evaluateAnswer(
  question: string,
  userAnswer: string,
  expectedConcept: string
): Promise<{
  score: number;
  feedback: string;
  followUpQuestion?: string;
}> {
  try {
    const prompt = `Evaluate this technical interview answer:
    
Question: ${question}
User Answer: ${userAnswer}
Module/Concept: ${expectedConcept}

Provide score (0-10), feedback, and optionally a follow-up question in JSON format:
{
  "score": <number 0-10>,
  "feedback": "<constructive feedback>",
  "followUpQuestion": "<optional follow-up question>"
}`;

    const responseText = await generateTextWithModelFallback(prompt);
    const evaluation = extractJsonObject(responseText) as {
      score?: number;
      feedback?: string;
      followUpQuestion?: string;
    };

    return {
      score: Math.max(0, Math.min(10, Math.round(evaluation.score ?? 5))),
      feedback: evaluation.feedback || "Good attempt. Expand key concepts with clearer examples.",
      followUpQuestion: evaluation.followUpQuestion,
    };
  } catch (error) {
    console.error("Error evaluating answer:", error);
    throw new Error("AI evaluation failed. Please retry submitting your answer.");
  }
}

export async function generateFollowUpQuestion(
  previousQuestion: string,
  userAnswer: string,
  topic: string
): Promise<string> {
  try {
    const prompt = `Based on this technical interview interaction:

Previous Question: ${previousQuestion}
User's Answer: ${userAnswer}
Topic: ${topic}

Generate ONE relevant follow-up question to assess deeper understanding:`;

    const responseText = await generateTextWithModelFallback(prompt);
    return responseText.trim();
  } catch (error) {
    console.error("Error generating follow-up:", error);
    return `Can you go one level deeper on ${topic} and explain the main trade-off involved?`;
  }
}
