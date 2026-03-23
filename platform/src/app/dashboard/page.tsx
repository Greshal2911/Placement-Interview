"use client";

import React, { useState, useEffect } from "react";
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
import { ModuleCard } from "@/components/shared/module-card";
import { ProtectedRoute } from "@/components/shared/protected-route";
import { useAuth } from "@/lib/auth-context";
import {
  TrendingUp,
  BookOpen,
  Zap,
  Target,
  ArrowRight,
  Clock,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  _count?: { questions: number };
}

interface ProgressData {
  overall: {
    userId: string;
    totalQuestionsAttempted: number;
    totalCorrect: number;
    overallScore: number;
  };
  modules: Array<{
    id: string;
    userId: string;
    moduleId: string;
    completed: boolean;
    score: number;
    questionsAttempted: number;
    questionsCorrect: number;
    module: Module;
  }>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [modules, setModules] = useState<Module[]>([]);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      try {
        const [modulesRes, progressRes] = await Promise.all([
          fetch("/api/modules"),
          fetch(`/api/progress/${userId}`),
        ]);

        if (modulesRes.ok) {
          const data = await modulesRes.json();
          setModules(data.data || []);
        }

        if (progressRes.ok) {
          const data = await progressRes.json();
          setProgress(data.data);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const stats = [
    {
      label: "Questions Attempted",
      value: progress?.overall?.totalQuestionsAttempted || 0,
      icon: BookOpen,
      color: "bg-blue-100 text-blue-600",
    },
    {
      label: "Correct Answers",
      value: progress?.overall?.totalCorrect || 0,
      icon: CheckCircle2,
      color: "bg-green-100 text-green-600",
    },
    {
      label: "Overall Score",
      value: progress?.overall?.overallScore || 0,
      icon: TrendingUp,
      color: "bg-purple-100 text-purple-600",
    },
    {
      label: "Modules Completed",
      value: progress?.modules?.filter((m) => m.completed).length || 0,
      icon: Target,
      color: "bg-amber-100 text-amber-600",
    },
  ];

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <main className="flex-1 overflow-auto">
            <div className="max-w-7xl mx-auto p-4 md:p-8">
              {!userId ? (
                <div className="text-center mt-8 text-slate-600">
                  Please log in to view your dashboard.
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="mb-8">
                    <h1 className="text-4xl font-bold text-slate-900">
                      Welcome back! 👋
                    </h1>
                    <p className="text-slate-600 mt-2">
                      Track your progress and continue your learning journey
                    </p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {stats.map((stat, index) => {
                      const Icon = stat.icon;
                      return (
                        <Card key={index}>
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-slate-600">
                                  {stat.label}
                                </p>
                                <p className="text-3xl font-bold text-slate-900 mt-2">
                                  {stat.value}
                                </p>
                              </div>
                              <div className={`p-3 rounded-lg ${stat.color}`}>
                                <Icon className="w-6 h-6" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card className="border-l-4 border-l-blue-600 hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-blue-600" />
                          Continue Learning
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-600 mb-4">
                          Pick up where you left off
                        </p>
                        <Button variant="outline" className="w-full" asChild>
                          <Link href="/modules">
                            View Modules <ArrowRight className="w-4 h-4 ml-2" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-amber-600 hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="w-5 h-5 text-amber-600" />
                          Practice Questions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-600 mb-4">
                          Practice MCQs and code challenges
                        </p>
                        <Button variant="outline" className="w-full" asChild>
                          <Link href="/practice">
                            Start Practice{" "}
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-purple-600 hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-purple-600" />
                          AI Interview
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-600 mb-4">
                          Face an AI-powered interview
                        </p>
                        <Button variant="outline" className="w-full" asChild>
                          <Link href="/interview">
                            Start Interview{" "}
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Modules Progress */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Your Modules</CardTitle>
                      <CardDescription>
                        Track your progress across all modules
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="text-center py-8">
                          Loading modules...
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {modules.map((module) => {
                            const moduleProgress = progress?.modules?.find(
                              (m) => m.moduleId === module.id,
                            );
                            const progressPercent = moduleProgress
                              ? Math.round(
                                  (moduleProgress.questionsCorrect /
                                    (moduleProgress.questionsAttempted || 1)) *
                                    100,
                                )
                              : 0;

                            return (
                              <ModuleCard
                                key={module.id}
                                id={module.id}
                                title={module.title}
                                description={module.description}
                                progress={progressPercent}
                                questionsCount={module._count?.questions || 0}
                                completed={moduleProgress?.completed || false}
                                onClick={() => {
                                  // Navigate to module
                                }}
                              />
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
