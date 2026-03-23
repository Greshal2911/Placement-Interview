"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/shared/navbar";
import { Sidebar } from "@/components/shared/sidebar";
import { ProtectedRoute } from "@/components/shared/protected-route";
import { useAuth } from "@/lib/auth-context";
import { CheckCircle2, XCircle, Loader } from "lucide-react";

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
  codeChallenge?: any;
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
  const [result, setResult] = useState<any>(null);
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

  const handleSubmitAnswer = async () => {
    if (!currentQuestion) return;

    try {
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
        setSubmitted(true);
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer("");
      setCodeAnswer("");
      setSubmitted(false);
      setResult(null);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedAnswer("");
      setCodeAnswer("");
      setSubmitted(false);
      setResult(null);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen bg-slate-50">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <Navbar />
            <div className="flex-1 flex items-center justify-center">
              <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!currentQuestion) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen bg-slate-50">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <Navbar />
            <div className="flex-1 flex items-center justify-center">
              <Card>
                <CardContent className="pt-6 text-center">
                  {!userId ? (
                    <p className="text-slate-600 mb-4">
                      Please log in to practice.
                    </p>
                  ) : (
                    <p className="text-slate-600 mb-4">No questions found</p>
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
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <main className="flex-1 overflow-auto">
            <div className="max-w-4xl mx-auto p-4 md:p-8">
              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-slate-600">
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  <span className="text-sm font-medium text-slate-600">
                    {Math.round(((currentIndex + 1) / questions.length) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${((currentIndex + 1) / questions.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Question Card */}
              <Card className="mb-8">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">
                        {currentQuestion.title}
                      </CardTitle>
                      <CardDescription>
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
                          className="flex items-center p-4 border-2 border-slate-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors"
                        >
                          <input
                            type="radio"
                            name="mcq"
                            value={option.id}
                            checked={selectedAnswer === option.id}
                            onChange={(e) => setSelectedAnswer(e.target.value)}
                            disabled={submitted}
                            className="w-4 h-4"
                          />
                          <span className="ml-3 text-slate-900">
                            {option.text}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Code Challenge */}
                  {currentQuestion.type === "CODE" && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-2">
                          Write your{" "}
                          {currentQuestion.codeChallenge?.language?.toUpperCase() ||
                            "C++"}{" "}
                          code:
                        </label>
                        <textarea
                          value={codeAnswer}
                          onChange={(e) => setCodeAnswer(e.target.value)}
                          disabled={submitted}
                          className="w-full h-64 p-4 font-mono text-sm border-2 border-slate-200 rounded-lg focus:border-blue-600 focus:outline-none"
                          placeholder={`// Write your ${currentQuestion.codeChallenge?.language || "C++"} code here...`}
                        />
                      </div>
                      {currentQuestion.codeChallenge?.testCases && (
                        <div className="bg-slate-50 p-4 rounded-lg">
                          <h4 className="font-medium text-slate-900 mb-2">
                            Test Cases:
                          </h4>
                          <div className="space-y-2 text-sm">
                            {currentQuestion.codeChallenge.testCases.map(
                              (testCase: any, idx: number) => (
                                <div key={idx} className="p-2 bg-white rounded">
                                  <p className="text-slate-600">
                                    <strong>Input:</strong> {testCase.input}
                                  </p>
                                  <p className="text-slate-600">
                                    <strong>Output:</strong> {testCase.output}
                                  </p>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Result */}
                  {submitted && result && (
                    <div
                      className={`p-4 rounded-lg ${
                        result.isCorrect
                          ? "bg-green-50 border-2 border-green-200"
                          : "bg-red-50 border-2 border-red-200"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        {result.isCorrect ? (
                          <>
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                            <span className="font-bold text-green-900">
                              Correct!
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-6 h-6 text-red-600" />
                            <span className="font-bold text-red-900">
                              Incorrect
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-sm text-slate-700">
                        You earned <strong>{result.score} points</strong>
                      </p>
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
                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={!selectedAnswer && !codeAnswer}
                    size="lg"
                  >
                    Submit Answer
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      setSelectedAnswer("");
                      setCodeAnswer("");
                      setSubmitted(false);
                      setResult(null);
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
