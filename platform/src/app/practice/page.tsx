"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/shared/navbar";
import { ProtectedRoute } from "@/components/shared/protected-route";
import { useAuth } from "@/lib/auth-context";
import {
  ArrowLeft,
  ArrowUpRight,
  Binary,
  BrainCircuit,
  CheckCircle2,
  GitBranch,
  Layers,
  Loader,
  Network,
  Play,
  ScanSearch,
  Sigma,
  Waypoints,
  XCircle,
} from "lucide-react";

interface Question {
  id: string;
  title: string;
  description: string;
  type: "MCQ" | "CODE";
  moduleId: string;
  difficulty: "Easy" | "Medium" | "Hard" | string;
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

interface Module {
  id: string;
  title: string;
  description: string;
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

type Track = {
  id: string;
  title: string;
  description: string;
  modules: number;
  problems: number;
  level: "Beginner" | "Intermediate" | "Advanced";
  icon: React.ComponentType<{ className?: string }>;
  borderClass: string;
  hoverClass: string;
  headerGradientClass: string;
  moduleKeywords: string[];
  keywords: string[];
};

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-96 w-full animate-pulse rounded-lg bg-slate-900" />
  ),
});

const tracks: Track[] = [
  {
    id: "arrays-strings",
    title: "Arrays and Strings",
    description:
      "Master sliding window, prefix sums, hashing tricks, and two-pointer patterns.",
    modules: 11,
    problems: 68,
    level: "Beginner",
    icon: Layers,
    borderClass: "border-cyan-400/35",
    hoverClass: "hover:border-cyan-300/60",
    headerGradientClass: "from-cyan-500/30 to-teal-500/10",
    moduleKeywords: ["array", "string"],
    keywords: [
      "array",
      "string",
      "subarray",
      "prefix",
      "window",
      "two pointer",
    ],
  },
  {
    id: "linkedlist-stack-queue",
    title: "Linked List, Stack, Queue",
    description:
      "Build intuition for pointer moves, monotonic stack design, and queue-based simulation.",
    modules: 9,
    problems: 52,
    level: "Beginner",
    icon: Waypoints,
    borderClass: "border-cyan-400/35",
    hoverClass: "hover:border-cyan-300/60",
    headerGradientClass: "from-cyan-500/30 to-teal-500/10",
    moduleKeywords: ["linked", "stack", "queue"],
    keywords: ["linked", "stack", "queue", "parenthesis", "next greater"],
  },
  {
    id: "hashing-maps",
    title: "Hashing and Maps",
    description:
      "Solve frequency counting, set membership, and collision-prone edge cases quickly.",
    modules: 8,
    problems: 47,
    level: "Beginner",
    icon: Sigma,
    borderClass: "border-cyan-400/35",
    hoverClass: "hover:border-cyan-300/60",
    headerGradientClass: "from-cyan-500/30 to-teal-500/10",
    moduleKeywords: ["hash", "map", "set"],
    keywords: ["hash", "map", "set", "frequency", "duplicate"],
  },
  {
    id: "binary-search",
    title: "Binary Search Patterns",
    description:
      "Go beyond sorted arrays with answer-space search and monotonic decision functions.",
    modules: 7,
    problems: 39,
    level: "Intermediate",
    icon: Binary,
    borderClass: "border-cyan-400/35",
    hoverClass: "hover:border-cyan-300/60",
    headerGradientClass: "from-cyan-500/30 to-teal-500/10",
    moduleKeywords: ["binary", "search"],
    keywords: ["binary", "search", "sorted", "lower bound", "upper bound"],
  },
  {
    id: "trees-bst-heaps",
    title: "Trees, BST, Heaps",
    description:
      "Practice DFS/BFS traversals, balancing ideas, and heap-based greedy workflows.",
    modules: 12,
    problems: 71,
    level: "Intermediate",
    icon: Network,
    borderClass: "border-cyan-400/35",
    hoverClass: "hover:border-cyan-300/60",
    headerGradientClass: "from-cyan-500/30 to-teal-500/10",
    moduleKeywords: ["tree", "bst", "heap"],
    keywords: ["tree", "bst", "heap", "traversal", "bfs", "dfs"],
  },
  {
    id: "backtracking-recursion",
    title: "Backtracking and Recursion",
    description:
      "Handle subsets, permutations, pruning, and recursion tree optimization strategies.",
    modules: 8,
    problems: 45,
    level: "Intermediate",
    icon: ScanSearch,
    borderClass: "border-cyan-400/35",
    hoverClass: "hover:border-cyan-300/60",
    headerGradientClass: "from-cyan-500/30 to-teal-500/10",
    moduleKeywords: ["recursion", "backtracking"],
    keywords: [
      "recursion",
      "backtracking",
      "subset",
      "permutation",
      "combination",
    ],
  },
  {
    id: "graphs",
    title: "Graph Algorithms",
    description:
      "Cover connected components, shortest path, topological sort, and DSU fundamentals.",
    modules: 13,
    problems: 77,
    level: "Advanced",
    icon: GitBranch,
    borderClass: "border-cyan-400/35",
    hoverClass: "hover:border-cyan-300/60",
    headerGradientClass: "from-cyan-500/30 to-teal-500/10",
    moduleKeywords: ["graph"],
    keywords: [
      "graph",
      "shortest",
      "path",
      "dijkstra",
      "topological",
      "union find",
    ],
  },
  {
    id: "dp",
    title: "Dynamic Programming",
    description:
      "Build tabulation and memoization instincts from 1D DP to grid and state-compression DP.",
    modules: 15,
    problems: 92,
    level: "Advanced",
    icon: BrainCircuit,
    borderClass: "border-cyan-400/35",
    hoverClass: "hover:border-cyan-300/60",
    headerGradientClass: "from-cyan-500/30 to-teal-500/10",
    moduleKeywords: ["dynamic", "dp"],
    keywords: ["dp", "dynamic", "memo", "knapsack", "subsequence"],
  },
];

const levelStyles: Record<Track["level"], string> = {
  Beginner: "bg-emerald-500/15 text-emerald-300 border-emerald-400/40",
  Intermediate: "bg-amber-500/15 text-amber-300 border-amber-400/40",
  Advanced: "bg-rose-500/15 text-rose-300 border-rose-400/40",
};

function getMonacoLanguage(language?: string): string {
  const normalized = (language || "cpp").toLowerCase();

  if (normalized === "c++") return "cpp";
  if (normalized === "python3") return "python";
  if (normalized === "js") return "javascript";

  return normalized;
}

function getInitialCode(question?: Question): string {
  if (!question) return "";

  return (
    question.codeChallenge?.boilerplate ||
    `#include <iostream>\nusing namespace std;\n\nint main() {\n  // Write your code here\n  return 0;\n}`
  );
}

function normalizeText(value: string): string {
  return value.toLowerCase();
}

function SandboxResultsPanel({
  codeExecutionResult,
}: {
  codeExecutionResult?: CodeExecutionResult | null;
}) {
  if (!codeExecutionResult) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-200">Sandbox Test Results</span>
        <Badge variant="outline" className="bg-slate-900 text-slate-200">
          {codeExecutionResult.passedCount} / {codeExecutionResult.totalCount}{" "}
          passed
        </Badge>
      </div>

      <div className="space-y-2">
        {codeExecutionResult.testResults.map((result, index) => (
          <div
            key={index}
            className={`rounded-lg border p-3 text-sm ${
              result.passed
                ? "border-emerald-500/35 bg-emerald-500/10"
                : "border-red-500/35 bg-red-500/10"
            }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {result.passed ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-400" />
                )}
                <span className="font-medium text-slate-100">
                  Case {index + 1}
                </span>
              </div>
              <span className="text-xs text-slate-300">
                {result.status.description}
              </span>
            </div>
            <div className="space-y-1 text-xs text-slate-300">
              <p>
                <strong>Input:</strong> {result.input || "(empty)"}
              </p>
              <p>
                <strong>Expected:</strong> {result.expectedOutput || "(empty)"}
              </p>
              <p>
                <strong>Actual:</strong> {result.actualOutput || "(empty)"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PracticePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const userId = user?.id || null;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(
    searchParams.get("track"),
  );
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    searchParams.get("question"),
  );

  const [codeAnswer, setCodeAnswer] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [isRunningSandbox, setIsRunningSandbox] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [sandboxResult, setSandboxResult] =
    useState<CodeExecutionResult | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [questionsRes, modulesRes] = await Promise.all([
          fetch("/api/questions?type=CODE&limit=200"),
          fetch("/api/modules"),
        ]);
        const questionsPayload = await questionsRes.json();
        const modulesPayload = await modulesRes.json();

        if (!questionsRes.ok) {
          throw new Error(
            questionsPayload?.message || "Failed to fetch coding questions",
          );
        }

        if (!modulesRes.ok) {
          throw new Error(modulesPayload?.message || "Failed to fetch modules");
        }

        if (!isMounted) return;
        setQuestions(questionsPayload.data || []);
        setModules(modulesPayload.data || []);
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        setError(
          err instanceof Error ? err.message : "Failed to fetch questions",
        );
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedTrackId) params.set("track", selectedTrackId);
    if (selectedQuestionId) params.set("question", selectedQuestionId);

    const query = params.toString();
    router.replace(query ? `/practice?${query}` : "/practice");
  }, [selectedTrackId, selectedQuestionId, router]);

  const selectedTrack = useMemo(
    () => tracks.find((track) => track.id === selectedTrackId) || null,
    [selectedTrackId],
  );

  const selectedTrackModuleIds = useMemo(() => {
    if (!selectedTrack) return [] as string[];

    return modules
      .filter((module) => {
        const moduleText = normalizeText(
          `${module.title} ${module.description}`,
        );
        return selectedTrack.moduleKeywords.some((keyword) =>
          moduleText.includes(normalizeText(keyword)),
        );
      })
      .map((module) => module.id);
  }, [modules, selectedTrack]);

  const filteredQuestions = useMemo(() => {
    if (!selectedTrack) return [];

    if (selectedTrackModuleIds.length > 0) {
      const moduleMappedQuestions = questions.filter((question) =>
        selectedTrackModuleIds.includes(question.moduleId),
      );

      if (moduleMappedQuestions.length > 0) {
        return moduleMappedQuestions;
      }
    }

    return questions.filter((question) => {
      const text = normalizeText(`${question.title} ${question.description}`);
      return selectedTrack.keywords.some((keyword) =>
        text.includes(normalizeText(keyword)),
      );
    });
  }, [questions, selectedTrack, selectedTrackModuleIds]);

  const trackHasStrictMatches = useMemo(() => {
    if (!selectedTrack) return false;

    if (selectedTrackModuleIds.length > 0) {
      const moduleMappedQuestions = questions.filter((question) =>
        selectedTrackModuleIds.includes(question.moduleId),
      );
      if (moduleMappedQuestions.length > 0) return true;
    }

    return questions.some((question) => {
      const text = normalizeText(`${question.title} ${question.description}`);
      return selectedTrack.keywords.some((keyword) =>
        text.includes(normalizeText(keyword)),
      );
    });
  }, [questions, selectedTrack, selectedTrackModuleIds]);

  const selectedQuestion = useMemo(
    () =>
      filteredQuestions.find(
        (question) => question.id === selectedQuestionId,
      ) || null,
    [filteredQuestions, selectedQuestionId],
  );

  const nextQuestionId = useMemo(() => {
    if (!selectedQuestion) return null;
    const currentIndex = filteredQuestions.findIndex(
      (q) => q.id === selectedQuestion.id,
    );
    if (currentIndex >= 0 && currentIndex < filteredQuestions.length - 1) {
      return filteredQuestions[currentIndex + 1].id;
    }
    return null;
  }, [filteredQuestions, selectedQuestion]);

  useEffect(() => {
    if (!selectedQuestion) return;

    setCodeAnswer(getInitialCode(selectedQuestion));
    setActionError(null);
    setSubmitted(false);
    setResult(null);
    setSandboxResult(null);
  }, [selectedQuestion?.id]);

  const handleOpenTrack = (trackId: string) => {
    setSelectedTrackId(trackId);
    setSelectedQuestionId(null);
  };

  const handleBackToTracks = () => {
    setSelectedTrackId(null);
    setSelectedQuestionId(null);
    setActionError(null);
    setSubmitted(false);
    setResult(null);
    setSandboxResult(null);
  };

  const handleOpenQuestion = (questionId: string) => {
    setSelectedQuestionId(questionId);
  };

  const handleBackToQuestionList = () => {
    setSelectedQuestionId(null);
    setActionError(null);
    setSubmitted(false);
    setResult(null);
    setSandboxResult(null);
  };

  const handleRunSandbox = async () => {
    if (!selectedQuestion || !codeAnswer.trim()) {
      setActionError("Add code before running sandbox.");
      return;
    }

    setIsRunningSandbox(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/questions/${selectedQuestion.id}/run`, {
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

  const handleSubmitAnswer = async () => {
    if (!selectedQuestion || !codeAnswer.trim()) {
      setActionError("Add code before submitting.");
      return;
    }

    if (!userId) {
      setActionError("Please log in before submitting.");
      return;
    }

    setIsSubmitting(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/questions/${selectedQuestion.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, code: codeAnswer }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Submission failed");
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

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-[#05070d] text-slate-100">
          <Navbar />
          <div className="flex h-[70vh] items-center justify-center">
            <Loader className="h-10 w-10 animate-spin text-cyan-300" />
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-[#05070d] text-slate-100">
          <Navbar />
          <div className="mx-auto max-w-2xl px-4 py-12 md:px-8">
            <Card className="border-red-400/30 bg-red-500/10">
              <CardHeader>
                <CardTitle className="text-red-200">
                  Could not load practice data
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-red-100">
                {error}
              </CardContent>
            </Card>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#05070d] text-slate-100">
        <Navbar />
        <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-12">
          {!selectedTrack && (
            <>
              <section className="mb-10">
                <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/80">
                  Practice Arena
                </p>
                <h1 className="mt-2 text-4xl font-bold leading-tight text-slate-50 md:text-5xl">
                  Learn DSA With Structured Tracks
                </h1>
                <p className="mt-3 max-w-2xl text-sm text-slate-400 md:text-base">
                  Choose a topic track. After selecting a track, you will see
                  only coding questions related to that topic and can open each
                  one in the coding interface.
                </p>
              </section>

              <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {tracks.map((track) => {
                  const Icon = track.icon;
                  return (
                    <article
                      key={track.id}
                      className={`group overflow-hidden rounded-2xl border bg-slate-950/85 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_40px_rgba(0,0,0,0.45)] ${track.borderClass} ${track.hoverClass}`}
                    >
                      <div
                        className={`h-24 bg-linear-to-r ${track.headerGradientClass}`}
                      >
                        <div className="flex h-full items-center justify-center">
                          <Icon className="h-8 w-8 text-slate-200/90" />
                        </div>
                      </div>

                      <div className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-lg font-semibold text-slate-50">
                            {track.title}
                          </h3>
                          <Badge
                            variant="outline"
                            className={levelStyles[track.level]}
                          >
                            {track.level}
                          </Badge>
                        </div>
                        <p className="line-clamp-3 text-sm leading-relaxed text-slate-400">
                          {track.description}
                        </p>
                        <p className="text-xs text-slate-500">
                          {track.modules} modules | {track.problems} problems
                        </p>
                        <Button
                          variant="ghost"
                          className="h-9 w-full justify-between border border-slate-800 bg-slate-900/70 text-slate-200 hover:bg-slate-800/80"
                          onClick={() => handleOpenTrack(track.id)}
                        >
                          Start Track
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </section>
            </>
          )}

          {selectedTrack && !selectedQuestion && (
            <section className="space-y-6">
              <Button
                variant="outline"
                className="border-slate-700 bg-slate-900/70 text-slate-200 hover:bg-slate-800"
                onClick={handleBackToTracks}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Tracks
              </Button>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">
                  Selected Track
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-100">
                  {selectedTrack.title}
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  {selectedTrack.description}
                </p>
              </div>

              {!trackHasStrictMatches && (
                <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-amber-200">
                  No coding questions are mapped to this topic yet.
                </div>
              )}

              {filteredQuestions.length === 0 ? (
                <Card className="border-slate-800 bg-slate-950/85">
                  <CardContent className="py-10 text-center">
                    <p className="text-sm text-slate-300">
                      No questions found for{" "}
                      <strong>{selectedTrack.title}</strong>.
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Add topic-specific coding questions in related modules to
                      populate this track.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {filteredQuestions.map((question, index) => (
                    <Card
                      key={question.id}
                      className="border-slate-800 bg-slate-950/85 shadow-[0_10px_24px_rgba(0,0,0,0.35)]"
                    >
                      <CardHeader className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-slate-500">Q{index + 1}</p>
                          <Badge
                            variant="outline"
                            className="border-slate-700 text-slate-300"
                          >
                            {question.difficulty}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg text-slate-100">
                          {question.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="mb-4 line-clamp-2 text-sm text-slate-400">
                          {question.description}
                        </p>
                        <Button
                          className="w-full bg-cyan-600 text-white hover:bg-cyan-500"
                          onClick={() => handleOpenQuestion(question.id)}
                        >
                          Open Coding Interface
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          )}

          {selectedTrack && selectedQuestion && (
            <section className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  className="border-slate-700 bg-slate-900/70 text-slate-200 hover:bg-slate-800"
                  onClick={handleBackToQuestionList}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Question List
                </Button>
                <Badge
                  variant="outline"
                  className="border-slate-700 text-slate-300"
                >
                  {selectedTrack.title}
                </Badge>
              </div>

              <Card className="border-slate-800 bg-slate-950/90">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-2xl text-slate-100">
                        {selectedQuestion.title}
                      </CardTitle>
                      <p className="mt-2 text-sm text-slate-400">
                        {selectedQuestion.description}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-slate-700 text-slate-300"
                    >
                      {selectedQuestion.difficulty}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
                    <div className="space-y-4 xl:col-span-2">
                      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
                        <h4 className="text-sm font-semibold text-slate-100">
                          Problem Details
                        </h4>
                        <p className="mt-2 text-sm leading-relaxed text-slate-400">
                          {selectedQuestion.description}
                        </p>
                      </div>

                      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
                        <h4 className="mb-2 text-sm font-semibold text-slate-100">
                          Visible Test Cases
                        </h4>
                        <div className="space-y-2">
                          {(selectedQuestion.codeChallenge?.testCases || [])
                            .filter((testCase) => testCase.visible !== false)
                            .map((testCase, idx) => (
                              <div
                                key={idx}
                                className="rounded-md border border-slate-700 bg-slate-900/80 p-2 text-xs text-slate-300"
                              >
                                <p>
                                  <strong>Input:</strong> {testCase.input}
                                </p>
                                <p>
                                  <strong>Expected:</strong> {testCase.output}
                                </p>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 xl:col-span-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-200">
                          Coding IDE
                        </p>
                        <span className="text-xs text-slate-400">
                          Monaco + Judge0 Sandbox
                        </span>
                      </div>

                      <div className="overflow-hidden rounded-lg border border-slate-700">
                        <MonacoEditor
                          key={selectedQuestion.id}
                          height="420px"
                          language={getMonacoLanguage(
                            selectedQuestion.codeChallenge?.language,
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

                  {actionError && (
                    <div className="rounded-lg border border-red-500/35 bg-red-500/10 p-3 text-sm text-red-200">
                      {actionError}
                    </div>
                  )}

                  {!submitted && sandboxResult && (
                    <div className="rounded-lg border border-cyan-400/35 bg-cyan-500/10 p-4">
                      <p className="mb-3 text-sm font-semibold text-cyan-200">
                        Sandbox Preview
                      </p>
                      <SandboxResultsPanel
                        codeExecutionResult={sandboxResult}
                      />
                    </div>
                  )}

                  {submitted && result && (
                    <div
                      className={`rounded-lg border p-4 ${
                        result.isCorrect
                          ? "border-emerald-500/35 bg-emerald-500/10"
                          : "border-red-500/35 bg-red-500/10"
                      }`}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        {result.isCorrect ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-400" />
                        )}
                        <span className="font-medium text-slate-100">
                          {result.isCorrect ? "Correct" : "Incorrect"}
                        </span>
                      </div>
                      <p className="mb-3 text-sm text-slate-200">
                        Score earned: <strong>{result.score}</strong>
                      </p>
                      <SandboxResultsPanel
                        codeExecutionResult={result.codeExecutionResult}
                      />

                      {result.isCorrect && nextQuestionId && (
                        <div className="mt-4 flex justify-end">
                          <Button
                            className="bg-emerald-600 text-white hover:bg-emerald-500"
                            onClick={() => handleOpenQuestion(nextQuestionId)}
                          >
                            Next Question
                            <ArrowUpRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {!(submitted && result?.isCorrect) && (
                      <>
                        <Button
                          variant="outline"
                          className="border-slate-700 bg-slate-900/70 text-slate-200 hover:bg-slate-800"
                          disabled={isRunningSandbox || !codeAnswer.trim()}
                          onClick={handleRunSandbox}
                        >
                          {isRunningSandbox ? (
                            <>
                              <Loader className="mr-2 h-4 w-4 animate-spin" />
                              Running...
                            </>
                          ) : (
                            <>
                              <Play className="mr-2 h-4 w-4" />
                              Run in Sandbox
                            </>
                          )}
                        </Button>

                        <Button
                          className="bg-cyan-600 text-white hover:bg-cyan-500"
                          disabled={isSubmitting || !codeAnswer.trim()}
                          onClick={handleSubmitAnswer}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader className="mr-2 h-4 w-4 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            "Submit Answer"
                          )}
                        </Button>
                      </>
                    )}

                    <Button
                      variant="ghost"
                      className="text-slate-300 hover:bg-slate-800"
                      onClick={() => {
                        setSubmitted(false);
                        setResult(null);
                        setSandboxResult(null);
                        setActionError(null);
                        setCodeAnswer(getInitialCode(selectedQuestion));
                      }}
                    >
                      Reset Code
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#05070d]" />}>
      <PracticePageContent />
    </Suspense>
  );
}
