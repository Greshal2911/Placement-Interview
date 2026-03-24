"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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

const InterviewLayout = ({
  children,
  maxWidth = "max-w-3xl",
}: {
  children: React.ReactNode;
  maxWidth?: string;
}) => (
  <ProtectedRoute>
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 overflow-auto w-full">
        <div className={`${maxWidth} mx-auto p-4 md:p-8`}>{children}</div>
      </main>
    </div>
  </ProtectedRoute>
);
import { Loader, CheckCircle2, XCircle, Send } from "lucide-react";

interface InterviewQuestion {
  question: string;
  userResponse?: string;
  evaluation?: {
    score: number;
    feedback: string;
    followUpQuestion?: string;
  };
}

export default function InterviewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const moduleId = searchParams.get("moduleId");
  const { user } = useAuth();

  const [interviewState, setInterviewState] = useState<
    "idle" | "in-progress" | "completed"
  >("idle");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [userResponse, setUserResponse] = useState("");
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [modules, setModules] = useState<any[]>([]);
  const [selectedModule, setSelectedModule] = useState(moduleId);
  const [score, setScore] = useState(0);

  const userId = user?.id;

  // Fetch modules on mount
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const res = await fetch("/api/modules");
        if (res.ok) {
          const data = await res.json();
          setModules(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching modules:", error);
      }
    };

    fetchModules();
  }, []);

  const startInterview = async () => {
    if (!selectedModule) {
      alert("Please select a module");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          moduleId: selectedModule,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setInterviewId(data.data.interviewId);
        setQuestions(data.data.questions || []);
        setInterviewState("in-progress");
      } else {
        const error = await res.json();
        alert(error.message || "Failed to start interview");
      }
    } catch (error) {
      console.error("Error starting interview:", error);
      alert("Error starting interview");
    } finally {
      setLoading(false);
    }
  };

  const submitResponse = async () => {
    if (!userResponse.trim() || !interviewId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/interviews/${interviewId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionIndex: currentQuestionIndex,
          userResponse: userResponse,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const updatedQuestions = [...questions];
        updatedQuestions[currentQuestionIndex] = {
          ...questions[currentQuestionIndex],
          userResponse,
          evaluation: data.data.currentEvaluation,
        };
        setQuestions(updatedQuestions);

        if (data.data.isComplete) {
          setInterviewState("completed");
          setScore(data.data.interview.score || 0);
        } else if (data.data.nextQuestion) {
          // Add follow-up question if exists
          if (data.data.nextQuestion.isFollowUp) {
            updatedQuestions.push(data.data.nextQuestion);
          }
          setTimeout(() => {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setUserResponse("");
          }, 1500);
        }
      }
    } catch (error) {
      console.error("Error submitting response:", error);
      alert("Error submitting response");
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const hasResponded = currentQuestion?.userResponse;

  // Idle State - Module Selection
  if (interviewState === "idle") {
    return (
      <InterviewLayout maxWidth="max-w-2xl">
        {!userId ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">
                Please log in to start an interview.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">AI-Powered Interview</CardTitle>
              <CardDescription className="text-muted-foreground">
                Test your knowledge with our AI interviewer powered by Gemini AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-2">
                  How it works:
                </h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Select a module you want to be interviewed on</li>
                  <li>Answer questions generated by our AI interviewer</li>
                  <li>Get instant feedback on each response</li>
                  <li>Receive follow-up questions based on your answers</li>
                  <li>Get a final score when the interview ends</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-3">
                  Select Module:
                </label>
                <div className="space-y-2">
                  {modules.map((module) => (
                    <label
                      key={module.id}
                      className="flex items-center p-4 border border-border rounded-lg cursor-pointer hover:border-primary transition-colors"
                    >
                      <input
                        type="radio"
                        name="module"
                        value={module.id}
                        checked={selectedModule === module.id}
                        onChange={(e) => setSelectedModule(e.target.value)}
                        className="w-4 h-4 accent-primary"
                      />
                      <div className="ml-3">
                        <p className="font-medium text-foreground">
                          {module.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {module.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <Button
                onClick={startInterview}
                disabled={loading || !selectedModule}
                size="lg"
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  "Start Interview"
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </InterviewLayout>
    );
  }

  // In Progress State
  if (interviewState === "in-progress") {
    return (
      <InterviewLayout maxWidth="max-w-3xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-muted-foreground">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              {Math.round(
                ((currentQuestionIndex + 1) / questions.length) * 100,
              )}
              %
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-linear-to-r from-primary to-secondary h-2 rounded-full transition-all"
              style={{
                width: `${
                  ((currentQuestionIndex + 1) / questions.length) * 100
                }%`,
              }}
            />
          </div>
        </div>

        {/* Question Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">
              {currentQuestion?.question}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Previous Response and Feedback */}
            {hasResponded && currentQuestion?.evaluation && (
              <div className="space-y-4">
                <div className="bg-card p-4 rounded-lg border border-border">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Your Response:
                  </p>
                  <p className="text-foreground">
                    {currentQuestion.userResponse}
                  </p>
                </div>

                <div
                  className={`p-4 rounded-lg border-l-4 ${
                    currentQuestion.evaluation.score >= 7
                      ? "border-l-emerald-500 bg-emerald-500/10"
                      : "border-l-amber-500 bg-amber-500/10"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {currentQuestion.evaluation.score >= 7 ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-amber-400" />
                      )}
                      <p className="font-bold text-foreground">
                        Score: {currentQuestion.evaluation.score}/10
                      </p>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    {currentQuestion.evaluation.feedback}
                  </p>
                </div>
              </div>
            )}

            {/* Response Input */}
            {!hasResponded && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-muted-foreground">
                  Your Answer:
                </label>
                <textarea
                  value={userResponse}
                  onChange={(e) => setUserResponse(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full h-32 p-4 border-2 border-border rounded-lg focus:border-primary focus:outline-none resize-none bg-card text-foreground placeholder:text-muted-foreground"
                />
                <Button
                  onClick={submitResponse}
                  disabled={loading || !userResponse.trim()}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Evaluating...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Answer
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Next Button */}
            {hasResponded && currentQuestionIndex < questions.length - 1 && (
              <Button
                onClick={() => {
                  setCurrentQuestionIndex(currentQuestionIndex + 1);
                  setUserResponse("");
                }}
                className="w-full"
              >
                Next Question
              </Button>
            )}
          </CardContent>
        </Card>
      </InterviewLayout>
    );
  }

  // Completed State
  return (
    <InterviewLayout maxWidth="max-w-2xl">
      <Card className="bg-card border border-border">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-16 h-16 text-emerald-500" />
          </div>
          <CardTitle className="text-3xl text-foreground">
            Interview Complete!
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Great job completing the interview
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Overall Score</p>
            <p className="text-6xl font-bold text-foreground">{score}/10</p>
          </div>

          <div className="bg-card border border-border p-6 rounded-lg">
            <h3 className="font-semibold text-foreground mb-4">
              Your Answers:
            </h3>
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div
                  key={idx}
                  className="border-l-4 border-l-primary pl-4 py-2"
                >
                  <p className="font-medium text-foreground mb-1">
                    Q{idx + 1}: {q.question}
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Your Answer: {q.userResponse}
                  </p>
                  {q.evaluation && (
                    <p className="text-sm">
                      <Badge
                        variant={
                          q.evaluation.score >= 7 ? "secondary" : "destructive"
                        }
                      >
                        Score: {q.evaluation.score}/10
                      </Badge>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => router.push("/dashboard")}
              className="w-full"
            >
              Back to Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setInterviewState("idle");
                setCurrentQuestionIndex(0);
                setQuestions([]);
                setUserResponse("");
                setScore(0);
              }}
              className="w-full"
            >
              Start Another Interview
            </Button>
          </div>
        </CardContent>
      </Card>
    </InterviewLayout>
  );
}
