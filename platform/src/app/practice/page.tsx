"use client";

import React, { useEffect, useMemo, useState } from "react";
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
import { ProtectedRoute } from "@/components/shared/protected-route";
import { useAuth } from "@/lib/auth-context";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Loader,
  MemoryStick,
  Play,
  XCircle,
} from "lucide-react";

interface MCQOption {
  id: string;
  text: string;
  order: number;
  isCorrect?: boolean;
}

interface Question {
  id: string;
  title: string;
  description: string;
  type: "MCQ" | "CODE";
  difficulty: "Easy" | "Medium" | "Hard" | string;
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

interface CodeExecutionResult {
  passedCount: number;
  totalCount: number;
  testResults: SandboxTestResult[];
}

interface SubmissionResult {
  isCorrect: boolean;
  score: number;
  codeExecutionResult?: CodeExecutionResult;
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

function PracticeLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 w-full overflow-auto">{children}</main>
      </div>
    </ProtectedRoute>
  );
}

function SandboxResultsPanel({
  codeExecutionResult,
}: {
  codeExecutionResult?: CodeExecutionResult | null;
}) {
  if (!codeExecutionResult) return null;

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">
          Sandbox Test Results
        </span>
        <Badge variant="outline" className="bg-muted/50 text-foreground">
          {codeExecutionResult.passedCount} / {codeExecutionResult.totalCount}{" "}
          passed
        </Badge>
      </div>

      <div className="space-y-3">
        {codeExecutionResult.testResults.map((result, index) => (
          <div
            key={index}
            className={`rounded-lg border p-3 bg-card ${
              result.passed ? "border-emerald-500/30" : "border-destructive/30"
            }`}
          >
            <div className="flex items-center justify-between mb-2 text-sm">
              <div className="flex items-center gap-2">
                {result.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-destructive" />
                )}
                <span className="font-medium">
                  Case {index + 1} · {result.passed ? "Passed" : "Failed"}
                </span>
              </div>
              <span className="text-muted-foreground text-xs">
                {result.status.description}
              </span>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                <strong>Input:</strong> {result.input}
              </p>
              <p>
                <strong>Expected:</strong> {result.expectedOutput}
              </p>
              <p>
                <strong>Actual:</strong> {result.actualOutput}
              </p>
              {result.compileOutput && (
                <p>
                  <strong>Compile:</strong> {result.compileOutput}
                </p>
              )}
              {result.stderr && (
                <p>
                  <strong>Stderr:</strong> {result.stderr}
                </p>
              )}
              {result.runtimeError && (
                <p>
                  <strong>Runtime:</strong> {result.runtimeError}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PracticePage() {
  const { user } = useAuth();
  const userId = user?.id || null;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [codeAnswer, setCodeAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [sandboxResult, setSandboxResult] =
    useState<CodeExecutionResult | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRunningSandbox, setIsRunningSandbox] = useState(false);

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    let isMounted = true;

    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/questions?limit=10");
        const payload = await res.json();

        if (!res.ok) {
          throw new Error(payload?.message || "Failed to fetch questions");
        }

        if (!isMounted) return;
        setQuestions(payload.data || []);
        setCurrentIndex(0);
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    };

    fetchQuestions();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setSelectedAnswer("");
    setSandboxResult(null);
    setResult(null);
    setActionError(null);
    setSubmitted(false);
    setCodeAnswer(getInitialCode(currentQuestion));
  }, [currentQuestion?.id]);

  const mcqCount = useMemo(
    () => questions.filter((question) => question.type === "MCQ").length,
    [questions],
  );

  const codeCount = useMemo(
    () => questions.filter((question) => question.type === "CODE").length,
    [questions],
  );

  const handlePrevious = () => {
    if (currentIndex === 0) return;
    setCurrentIndex((prev) => prev - 1);
  };

  const handleNext = () => {
    if (currentIndex >= questions.length - 1) return;
    setCurrentIndex((prev) => prev + 1);
  };

  const handleSubmitAnswer = async () => {
    if (!currentQuestion) return;
    if (!userId) {
      setActionError("Please log in before submitting answers.");
      return;
    }

    if (currentQuestion.type === "MCQ" && !selectedAnswer) {
      setActionError("Select an answer before submitting.");
      return;
    }

    if (currentQuestion.type === "CODE" && !codeAnswer.trim()) {
      setActionError("Enter your code before submitting.");
      return;
    }

    setIsSubmitting(true);
    setActionError(null);

    try {
      const payload: Record<string, unknown> = { userId };
      if (currentQuestion.type === "MCQ") {
        payload.selectedOption = selectedAnswer;
      } else {
        payload.code = codeAnswer;
      }

      const res = await fetch(`/api/questions/${currentQuestion.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to submit answer");
      }

      setResult({
        isCorrect: data.data.isCorrect,
        score: data.data.score,
        codeExecutionResult: data.data.codeExecutionResult,
      });
      setSandboxResult(data.data.codeExecutionResult || null);
      setSubmitted(true);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRunSandbox = async () => {
    if (!currentQuestion || currentQuestion.type !== "CODE") return;
    if (!codeAnswer.trim()) {
      setActionError("Enter some code before running the sandbox.");
      return;
    }

    setIsRunningSandbox(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/questions/${currentQuestion.id}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeAnswer }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Sandbox run failed");
      }

      setSandboxResult(data.data);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Sandbox run failed");
    } finally {
      setIsRunningSandbox(false);
    }
  };

  if (loading) {
    return (
      <PracticeLayout>
        <div className="flex h-full items-center justify-center">
          <Loader className="w-10 h-10 animate-spin text-primary" />
        </div>
      </PracticeLayout>
    );
  }

  if (error || !currentQuestion) {
    return (
      <PracticeLayout>
        <div className="max-w-3xl mx-auto p-4 md:p-8">
          <Card>
            <CardHeader>
              <CardTitle>Practice unavailable</CardTitle>
              <CardDescription>
                {error ||
                  "We could not load any questions right now. Try again later."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {userId
                    ? "Refresh the page or check your connection."
                    : "Please log in to unlock the practice workflow."}
                </p>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  Reload
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PracticeLayout>
    );
  }

  return (
    <PracticeLayout>
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3 text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-muted-foreground text-xs">MCQ Challenges</p>
                <p className="text-lg font-semibold text-foreground">
                  {mcqCount}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3 text-sm">
              <MemoryStick className="w-5 h-5 text-sky-500" />
              <div>
                <p className="text-muted-foreground text-xs">Code Challenges</p>
                <p className="text-lg font-semibold text-foreground">
                  {codeCount}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3 text-sm">
              <Clock3 className="w-5 h-5 text-primary" />
              <div>
                <p className="text-muted-foreground text-xs">Difficulty</p>
                <p className="text-lg font-semibold text-foreground">
                  {currentQuestion.difficulty}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 md:p-5">
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

        <Card className="border-border/80 shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
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
            {currentQuestion.type === "MCQ" && (
              <div className="space-y-3">
                {currentQuestion.mcqOptions?.map((option) => (
                  <label
                    key={option.id}
                    className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
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
                      onChange={(event) =>
                        setSelectedAnswer(event.target.value)
                      }
                      disabled={submitted}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="text-foreground">{option.text}</span>
                  </label>
                ))}
              </div>
            )}

            {currentQuestion.type === "CODE" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
                  <div className="xl:col-span-2 space-y-4">
                    <div className="rounded-lg border border-border bg-muted/30 p-4">
                      <h4 className="text-sm font-semibold text-foreground mb-2">
                        Problem Details
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
                              <p className="text-muted-foreground text-xs">
                                <strong>Input:</strong> {testCase.input}
                              </p>
                              <p className="text-muted-foreground text-xs">
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
                      This run checks your code without locking the final
                      submission.
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
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <XCircle className="w-6 h-6 text-destructive" />
                  )}
                  <span className="font-bold text-foreground">
                    {result.isCorrect ? "Correct!" : "Try again"}
                  </span>
                </div>
                <p className="text-sm text-foreground">
                  You earned <strong>{result.score} points</strong>
                </p>
                <SandboxResultsPanel
                  codeExecutionResult={result.codeExecutionResult}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
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
              disabled={currentIndex === questions.length - 1}
            >
              Next
            </Button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {currentQuestion.type === "CODE" && (
              <Button
                variant="outline"
                onClick={handleRunSandbox}
                disabled={isRunningSandbox || !codeAnswer.trim()}
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
                isSubmitting ||
                (currentQuestion.type === "MCQ" && !selectedAnswer) ||
                (currentQuestion.type === "CODE" && !codeAnswer.trim())
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
            {submitted && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSubmitted(false);
                  setResult(null);
                  setActionError(null);
                  setSandboxResult(null);
                  setSelectedAnswer("");
                  setCodeAnswer(getInitialCode(currentQuestion));
                }}
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>
    </PracticeLayout>
  );
}
