import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not set");
}

const genAI = new GoogleGenerativeAI(apiKey);

export const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse JSON from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Could not parse questions from response");
    }

    const questions = JSON.parse(jsonMatch[0]);
    return questions;
  } catch (error) {
    console.error("Error generating questions:", error);
    throw error;
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

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse evaluation from response");
    }

    const evaluation = JSON.parse(jsonMatch[0]);
    return evaluation;
  } catch (error) {
    console.error("Error evaluating answer:", error);
    throw error;
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

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error generating follow-up:", error);
    throw error;
  }
}
