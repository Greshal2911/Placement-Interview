"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/shared/navbar";
import { Sidebar } from "@/components/shared/sidebar";
import { ProtectedRoute } from "@/components/shared/protected-route";
import { useAuth } from "@/lib/auth-context";
import {
  CheckCircle2,
  XCircle,
  Loader,
  AlertTriangle,
  Clock3,
  MemoryStick,
  Play,
} from "lucide-react";

interface MCQOption {
  id: string;
  text: string;
  order: number;
}

interface Question {
  id: string;
  title: string;
  description: string;
  type: "MCQ" | "CODE";
  difficulty: string;
  mcqOptions?: MCQOption[];
  codeChallenge?: {
    language?: string;
    boilerplate?: string;
    testCases?: Array<{
      input: string;
      output: string;
      visible?: boolean;
    }>;
  };
}

interface SandboxTestResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  status: { id: number; description: string };
  stderr?: string;
  compileOutput?: string;
  runtimeError?: string;
  time?: string;
  memory?: number;
}

interface SubmissionResult {
  isCorrect: boolean;
  score: number;
  codeExecutionResult?: CodeExecutionResult;
}

interface CodeExecutionResult {
  passedCount: number;
  totalCount: number;
  testResults: SandboxTestResult[];
}

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-96 w-full rounded-lg border border-border bg-muted animate-pulse" />
  ),
});

function getMonacoLanguage(language?: string): string {
  const normalized = (language || "cpp").toLowerCase();

  if (normalized === "c++") return "cpp";
  if (normalized === "python3") return "python";
  if (normalized === "js") return "javascript";

  return normalized;
}

function getInitialCode(question?: Question): string {
  if (question?.type !== "CODE") return "";

  return (
    question.codeChallenge?.boilerplate ||
    `#include <iostream>\nusing namespace std;\n\nint main() {\n  // Write your code here\n  return 0;\n}`
  );
}

function SandboxResultsPanel({
  codeExecutionResult,
}: {
  codeExecutionResult: CodeExecutionResult;
}) {
  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">Sandbox Test Results</span>
        <Badge variant="outline" className="bg-muted/50 text-foreground">
          {codeExecutionResult.passedCount} / {codeExecutionResult.totalCount} passed
        </Badge>
      </div>

      <div className="space-y-2">
        {codeExecutionResult.testResults.map((testResult, index) => {
          const hasError =
            !!testResult.compileOutput ||
            !!testResult.stderr ||
            !!testResult.runtimeError;

          return (
            <div
              key={index}
              className={`rounded-lg border p-3 bg-card ${
                testResult.passed ? "border-emerald-500/30" : "border-destructive/30"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  {testResult.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-destructive" />
                  )}
                  <span className="text-sm font-semibold text-foreground">
                    Test Case {index + 1}
                  </span>
                  <Badge variant="outline" className="bg-muted/40 text-muted-foreground">
                    {testResult.status.description}
                  </Badge>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {testResult.time && (
                    <span className="flex items-center gap-1">
                      <Clock3 className="w-3.5 h-3.5" />
                      {testResult.time}s
                    </span>
                  )}
                  {typeof testResult.memory === "number" && (
                    <span className="flex items-center gap-1">
                      <MemoryStick className="w-3.5 h-3.5" />
                      {testResult.memory} KB
                    </span>
                  )}
                </div>
              </div>

              <div className="grid gap-2 text-xs md:grid-cols-3">
                <div className="rounded border border-border bg-muted/40 p-2">
                  <p className="mb-1 font-medium text-muted-foreground">Input</p>
                  <pre className="whitespace-pre-wrap font-mono text-foreground">
                    {testResult.input || "(empty)"}
                  </pre>
                </div>
                <div className="rounded border border-border bg-muted/40 p-2">
                  <p className="mb-1 font-medium text-muted-foreground">Expected</p>
                  <pre className="whitespace-pre-wrap font-mono text-foreground">
                    {testResult.expectedOutput || "(empty)"}
                  </pre>
                </div>
                <div className="rounded border border-border bg-muted/40 p-2">
                  <p className="mb-1 font-medium text-muted-foreground">Actual</p>
                  <pre className="whitespace-pre-wrap font-mono text-foreground">
                    {testResult.actualOutput || "(empty)"}
                  </pre>
                </div>
              </div>

              {hasError && (
                <div className="mt-2 rounded border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-200">
                  <p className="mb-1 flex items-center gap-1 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Execution Diagnostics
                  </p>
                  {testResult.compileOutput && (
                    <pre className="whitespace-pre-wrap font-mono">
                      Compile: {testResult.compileOutput}
                    </pre>
                  )}
                  {testResult.stderr && (
                    <pre className="whitespace-pre-wrap font-mono">
                      Stderr: {testResult.stderr}
                    </pre>
                  )}
                  {testResult.runtimeError && (
                    <pre className="whitespace-pre-wrap font-mono">
                      Runtime: {testResult.runtimeError}
                    </pre>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PracticePage() {
  const searchParams = useSearchParams();
  const moduleId = searchParams.get("moduleId");
  const { user } = useAuth();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [codeAnswer, setCodeAnswer] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [sandboxResult, setSandboxResult] = useState<CodeExecutionResult | null>(
    null,
  );
  const [isRunningSandbox, setIsRunningSandbox] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;

    const fetchQuestions = async () => {
      try {
        const url = new URL("/api/questions", window.location.origin);
        if (moduleId) url.searchParams.append("moduleId", moduleId);
        url.searchParams.append("limit", "20");

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setQuestions(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching questions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [moduleId, userId]);

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    if (!currentQuestion) return;

    if (currentQuestion.type === "CODE") {
      setCodeAnswer(getInitialCode(currentQuestion));
      setSandboxResult(null);
      setActionError(null);
    }
  }, [currentQuestion?.id]);

  const handleSubmitAnswer = async () => {
    if (!currentQuestion) return;

    try {
      setActionError(null);
      setIsSubmitting(true);
      const answer =
        currentQuestion.type === "MCQ" ? selectedAnswer : codeAnswer;

      const res = await fetch(`/api/questions/${currentQuestion.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          selectedOption: currentQuestion.type === "MCQ" ? answer : undefined,
          code: currentQuestion.type === "CODE" ? answer : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data.data);
        setSandboxResult(data.data?.codeExecutionResult || null);
        setSubmitted(true);
      } else {
        const data = await res.json();
        setActionError(data?.message || "Failed to submit answer");
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
      setActionError("Failed to submit answer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRunSandbox = async () => {
    if (!currentQuestion || currentQuestion.type !== "CODE") return;
    if (!codeAnswer.trim()) return;

    try {
      setActionError(null);
      setIsRunningSandbox(true);
      const res = await fetch(`/api/questions/${currentQuestion.id}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeAnswer }),
      });

      if (res.ok) {
        const data = await res.json();
        setSandboxResult(data.data);
      } else {
        const data = await res.json();
        setActionError(data?.message || "Failed to run code in sandbox");
      }
    } catch (error) {
      console.error("Error running sandbox:", error);
      setActionError("Failed to run code in sandbox");
    } finally {
      setIsRunningSandbox(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer("");
      setCodeAnswer("");
      setSubmitted(false);
      setResult(null);
      setSandboxResult(null);
      setActionError(null);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedAnswer("");
      setCodeAnswer("");
      setSubmitted(false);
      setResult(null);
      setSandboxResult(null);
      setActionError(null);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen bg-background">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <Navbar />
            <div className="flex-1 flex items-center justify-center">
              <Loader className="w-8 h-8 animate-spin text-primary" />
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!currentQuestion) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen bg-background">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <Navbar />
            <div className="flex-1 flex items-center justify-center">
              <Card>
                <CardContent className="pt-6 text-center">
                  {!userId ? (
                    <p className="text-muted-foreground mb-4">
                      Please log in to practice.
                    </p>
                  ) : (
                    <p className="text-muted-foreground mb-4">No questions found</p>
                  )}
                  <Button variant="outline">Go Back</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <main className="flex-1 overflow-auto">
            <div className="max-w-4xl mx-auto p-4 md:p-8">
              {/* Progress Bar */}
              <div className="mb-8 rounded-xl border border-border bg-card p-4 md:p-5">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    {Math.round(((currentIndex + 1) / questions.length) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-linear-to-r from-primary to-secondary h-2 rounded-full transition-all"
                    style={{
                      width: `${((currentIndex + 1) / questions.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Question Card */}
              <Card className="mb-8 border-border/80 shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2 text-foreground">
                        {currentQuestion.title}
                      </CardTitle>
                      <CardDescription className="text-muted-foreground">
                        {currentQuestion.description}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        currentQuestion.difficulty === "Easy"
                          ? "secondary"
                          : currentQuestion.difficulty === "Medium"
                            ? "default"
                            : "destructive"
                      }
                    >
                      {currentQuestion.difficulty}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* MCQ Questions */}
                  {currentQuestion.type === "MCQ" && (
                    <div className="space-y-3">
                      {currentQuestion.mcqOptions?.map((option) => (
                        <label
                          key={option.id}
                          className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedAnswer === option.id
                              ? "border-primary bg-primary/10"
                              : "border-border bg-muted/20 hover:border-primary/60 hover:bg-muted/40"
                          } ${submitted ? "opacity-80 cursor-not-allowed" : ""}`}
                        >
                          <input
                            type="radio"
                            name="mcq"
                            value={option.id}
                            checked={selectedAnswer === option.id}
                            onChange={(e) => setSelectedAnswer(e.target.value)}
                            disabled={submitted}
                            className="w-4 h-4 accent-primary"
                          />
                          <span className="ml-3 text-foreground">
                            {option.text}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Code Challenge */}
                  {currentQuestion.type === "CODE" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
                        <div className="xl:col-span-2 space-y-4">
                          <div className="rounded-lg border border-border bg-muted/30 p-4">
                            <h4 className="text-sm font-semibold text-foreground mb-2">
                              Problem Description
                            </h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {currentQuestion.description}
                            </p>
                            <div className="mt-3 flex items-center gap-2">
                              <Badge variant="outline">
                                {currentQuestion.codeChallenge?.language?.toUpperCase() ||
                                  "CPP"}
                              </Badge>
                              <Badge variant="secondary">
                                {currentQuestion.difficulty}
                              </Badge>
                            </div>
                          </div>

                          <div className="rounded-lg border border-border bg-card p-4">
                            <h4 className="text-sm font-semibold text-foreground mb-2">
                              Example Test Cases
                            </h4>
                            <div className="space-y-2 text-sm">
                              {(currentQuestion.codeChallenge?.testCases || [])
                                .filter((testCase) => testCase.visible !== false)
                                .map((testCase, idx) => (
                                  <div
                                    key={idx}
                                    className="rounded border border-border bg-muted/30 p-2"
                                  >
                                    <p className="text-muted-foreground">
                                      <strong>Input:</strong> {testCase.input}
                                    </p>
                                    <p className="text-muted-foreground">
                                      <strong>Expected:</strong> {testCase.output}
                                    </p>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>

                        <div className="xl:col-span-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-foreground">
                              IDE
                            </label>
                            <span className="text-xs text-muted-foreground">
                              Powered by Monaco + Judge0 Sandbox
                            </span>
                          </div>
                          <div className="rounded-lg overflow-hidden border border-border">
                            <MonacoEditor
                              key={currentQuestion.id}
                              height="420px"
                              language={getMonacoLanguage(
                                currentQuestion.codeChallenge?.language,
                              )}
                              theme="vs-dark"
                              value={codeAnswer}
                              onChange={(value) => {
                                setCodeAnswer(value || "");
                                setSandboxResult(null);
                                setActionError(null);
                              }}
                              options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                lineNumbers: "on",
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                tabSize: 2,
                                wordWrap: "on",
                                padding: { top: 12 },
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {!submitted && sandboxResult && (
                        <div className="rounded-lg border border-primary/40 bg-primary/10 p-4">
                          <p className="text-sm font-semibold text-primary">
                            Sandbox Preview
                          </p>
                          <p className="text-xs text-primary/90 mt-1">
                            This run checks your code without saving final score.
                          </p>
                          <SandboxResultsPanel codeExecutionResult={sandboxResult} />
                        </div>
                      )}
                    </div>
                  )}

                  {actionError && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                      {actionError}
                    </div>
                  )}

                  {/* Result */}
                  {submitted && result && (
                    <div
                      className={`p-4 rounded-lg ${
                        result.isCorrect
                          ? "bg-emerald-500/10 border border-emerald-500/30"
                          : "bg-destructive/10 border border-destructive/30"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        {result.isCorrect ? (
                          <>
                            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                            <span className="font-bold text-emerald-300">
                              Correct!
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-6 h-6 text-destructive" />
                            <span className="font-bold text-destructive">
                              Incorrect
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-sm text-foreground">
                        You earned <strong>{result.score} points</strong>
                      </p>

                      {currentQuestion.type === "CODE" &&
                        result.codeExecutionResult && (
                          <SandboxResultsPanel
                            codeExecutionResult={result.codeExecutionResult}
                          />
                        )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-between">
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleNext}
                    disabled={
                      currentIndex === questions.length - 1 || !submitted
                    }
                  >
                    Next
                  </Button>
                </div>
                {!submitted ? (
                  <div className="flex gap-2">
                    {currentQuestion.type === "CODE" && (
                      <Button
                        variant="outline"
                        onClick={handleRunSandbox}
                        disabled={!codeAnswer.trim() || isRunningSandbox || isSubmitting}
                        size="lg"
                      >
                        {isRunningSandbox ? (
                          <>
                            <Loader className="w-4 h-4 mr-2 animate-spin" />
                            Running...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Run in Sandbox
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      onClick={handleSubmitAnswer}
                      disabled={
                        (!selectedAnswer && !codeAnswer) ||
                        isRunningSandbox ||
                        isSubmitting
                      }
                      size="lg"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Answer"
                      )}
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => {
                      setSelectedAnswer("");
                      setCodeAnswer("");
                      setSubmitted(false);
                      setResult(null);
                      setSandboxResult(null);
                      setActionError(null);
                    }}
                    variant="outline"
                    size="lg"
                  >
                    Try Again
                  </Button>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
