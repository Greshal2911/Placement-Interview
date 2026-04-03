"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Navbar } from "@/components/shared/navbar";
import { ProtectedRoute } from "@/components/shared/protected-route";
import { useAuth } from "@/lib/auth-context";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  TrendingUp,
  Award,
  BookOpen,
  Clock,
  Flame,
  Target,
  Trophy,
  CalendarClock,
  Loader,
} from "lucide-react";

interface ModuleStats {
  moduleId: string;
  name: string;
  totalQuestions: number;
  attempted: number;
  solved: number;
  remaining: number;
}

interface DailyProgressPoint {
  day: string;
  attempted: number;
  solved: number;
}

interface AnalyticsPayload {
  summary: {
    totalAttempted: number;
    totalSolved: number;
    accuracy: number;
    totalTimeMinutes: number;
    currentStreak: number;
  };
  modules: ModuleStats[];
  dailyProgress: DailyProgressPoint[];
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const lastFallbackRef = useRef(0);

  const fetchAnalytics = useCallback(
    async (showLoader: boolean) => {
      if (!user?.id) return;

      try {
        if (showLoader) {
          setLoading(true);
        }

        const res = await fetch(`/api/analytics/${user.id}`, { cache: "no-store" });
        const payload = await res.json();

        if (!res.ok) {
          throw new Error(payload?.message || "Failed to load analytics");
        }

        setAnalytics(payload.data);
        setApiError(null);
      } catch (error) {
        setApiError(error instanceof Error ? error.message : "Failed to load analytics");
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [user?.id],
  );

  useEffect(() => {
    if (!user?.id) {
      setAnalytics(null);
      setLoading(false);
      return;
    }

    fetchAnalytics(true);

    let pollId: number | null = null;
    let stream: EventSource | null = null;

    const stopPolling = () => {
      if (pollId !== null) {
        window.clearInterval(pollId);
        pollId = null;
      }
    };

    const startPolling = () => {
      if (pollId === null) {
        pollId = window.setInterval(() => {
          fetchAnalytics(false);
        }, 15000);
      }
    };

    const maybeRunFallbackFetch = () => {
      const now = Date.now();
      if (now - lastFallbackRef.current > 5000) {
        lastFallbackRef.current = now;
        fetchAnalytics(false);
      }
    };

    if (typeof window !== "undefined" && "EventSource" in window) {
      stream = new EventSource(`/api/analytics/${user.id}/stream`);

      stream.onopen = () => {
        stopPolling();
        setApiError(null);
      };

      stream.addEventListener("analytics", (event) => {
        try {
          const payload = JSON.parse((event as MessageEvent).data) as AnalyticsPayload;
          setAnalytics(payload);
          setApiError(null);
          setLoading(false);
        } catch {
          setApiError("Received invalid analytics stream payload");
        }
      });

      stream.addEventListener("error", () => {
        setApiError("Live analytics stream interrupted. Falling back to background refresh.");
        startPolling();
        maybeRunFallbackFetch();
      });
    } else {
      startPolling();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchAnalytics(false);
      }
    };

    const handleFocus = () => {
      fetchAnalytics(false);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      if (stream) {
        stream.close();
      }
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [user?.id, fetchAnalytics]);

  const moduleStats = analytics?.modules ?? [];
  const dailyProgress = analytics?.dailyProgress ?? [];
  const totalAttempted = analytics?.summary.totalAttempted ?? 0;
  const totalSolved = analytics?.summary.totalSolved ?? 0;
  const accuracy = analytics?.summary.accuracy ?? 0;
  const totalTimeMinutes = analytics?.summary.totalTimeMinutes ?? 0;
  const currentStreak = analytics?.summary.currentStreak ?? 0;

  const chartConfig = {
    solved: {
      label: "Solved",
      color: "#06b6d4",
    },
    attempted: {
      label: "Attempted",
      color: "#14b8a6",
    },
  } satisfies ChartConfig;

  const stats = [
    {
      label: "Questions Solved",
      value: `${totalSolved}`,
      icon: <BookOpen className="h-5 w-5" />,
      color: "text-cyan-300",
      helper: `${totalAttempted} attempted overall`,
    },
    {
      label: "Accuracy",
      value: `${accuracy}%`,
      icon: <Award className="h-5 w-5" />,
      color: "text-amber-300",
      helper: "Based on attempted questions",
    },
    {
      label: "Total Time",
      value: `${(totalTimeMinutes / 60).toFixed(1)} hrs`,
      icon: <Clock className="h-5 w-5" />,
      color: "text-sky-300",
      helper: `${totalTimeMinutes} minutes practiced`,
    },
    {
      label: "Current Streak",
      value: `${currentStreak} days`,
      icon: <Flame className="h-5 w-5" />,
      color: "text-emerald-300",
      helper: "Keep solving daily to grow it",
    },
  ];

  const achievements = useMemo(() => {
    const modulesWithTenSolved = moduleStats.filter((module) => module.solved >= 10).length;
    const moduleTarget = Math.max(moduleStats.length, 1);

    return [
      {
        title: "Daily Discipline",
        description: "Solve at least 1 question every day",
        progress: currentStreak,
        target: 10,
        icon: CalendarClock,
        tone: "text-cyan-300 border-cyan-500/30 bg-cyan-500/10",
      },
      {
        title: "Accuracy Builder",
        description: "Maintain 80%+ accuracy across 50 attempts",
        progress: Math.min(totalAttempted, 50),
        target: 50,
        icon: Target,
        tone: "text-amber-300 border-amber-500/30 bg-amber-500/10",
      },
      {
        title: "Module Finisher",
        description: "Reach 10 solved questions in each active module",
        progress: modulesWithTenSolved,
        target: moduleTarget,
        icon: Trophy,
        tone: "text-emerald-300 border-emerald-500/30 bg-emerald-500/10",
      },
    ];
  }, [moduleStats, currentStreak, totalAttempted]);

  if (!user) return null;

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

  if (apiError && !analytics) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-[#05070d] text-slate-100">
          <Navbar />
          <main className="mx-auto w-full max-w-3xl px-4 py-10 md:px-8">
            <Card className="border-red-400/30 bg-red-500/10">
              <CardHeader>
                <CardTitle className="text-red-200">Could not load analytics</CardTitle>
                <CardDescription className="text-red-100">{apiError}</CardDescription>
              </CardHeader>
            </Card>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#05070d] text-slate-100">
        <Navbar />
        <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-12">
          <div className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/80">Practice Analytics</p>
              <h1 className="mt-2 flex items-center gap-2 text-4xl font-bold leading-tight text-slate-50 md:text-5xl">
                <TrendingUp className="h-8 w-8 text-cyan-300" />
                Analytics & Progress
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-400 md:text-base">
                Track solved questions, accuracy, time investment, and consistency habits.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <Card
                  key={index}
                  className="border-cyan-400/25 bg-slate-950/85 shadow-[0_10px_24px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-300/60 hover:bg-linear-to-br hover:from-cyan-500/10 hover:to-teal-500/5 hover:shadow-[0_16px_30px_rgba(8,145,178,0.22)]"
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-sm text-slate-400">
                      {stat.label}
                      <span className={`${stat.color}`}>{stat.icon}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <p className="text-3xl font-bold text-slate-100">{stat.value}</p>
                    <p className="text-xs text-slate-500">{stat.helper}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div>
              <Card className="border-slate-800 bg-slate-950/85">
                <CardHeader>
                  <CardTitle className="text-slate-100">Daily Progress </CardTitle>
                  <CardDescription className="text-slate-400">
                    Solved vs attempted questions in the last 7 days
                  </CardDescription>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-slate-200">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: chartConfig.attempted.color }}
                      />
                      {chartConfig.attempted.label}
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-slate-200">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: chartConfig.solved.color }}
                      />
                      {chartConfig.solved.label}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-80">
                    <BarChart data={dailyProgress} barGap={8}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2f364f" vertical={false} />
                      <XAxis
                        dataKey="day"
                        stroke="#94a3b8"
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} width={30} />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(8,145,178,0.15)" }} />
                      <Bar
                        dataKey="attempted"
                        name={chartConfig.attempted.label}
                        fill="var(--color-attempted)"
                        radius={[8, 8, 0, 0]}
                      />
                      <Bar
                        dataKey="solved"
                        name={chartConfig.solved.label}
                        fill="var(--color-solved)"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
              <Card className="order-1 border-slate-800 bg-slate-950/85">
                <CardHeader>
                  <CardTitle className="text-slate-100">Module-Wise Questions Solved</CardTitle>
                  <CardDescription className="text-slate-400">
                    Module name with total, solved, and remaining questions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {moduleStats.length === 0 ? (
                    <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4 text-sm text-slate-300">
                      No module progress yet. Start solving questions to see dynamic stats.
                    </div>
                  ) : (
                    <ScrollArea className="h-120 pr-1 md:h-88">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {moduleStats.map((module, index) => (
                      <div
                        key={module.moduleId || index}
                        className="rounded-xl border border-cyan-400/25 bg-slate-950/85 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-300/60 hover:bg-linear-to-br hover:from-cyan-500/10 hover:to-teal-500/5 hover:shadow-[0_16px_30px_rgba(8,145,178,0.22)]"
                      >
                        <p className="mb-3 line-clamp-1 font-semibold text-slate-100">{module.name}</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between text-slate-400">
                            <span>Total Questions</span>
                            <span className="font-semibold text-slate-100">{module.totalQuestions}</span>
                          </div>
                          <div className="flex items-center justify-between text-cyan-200/90">
                            <span>Solved</span>
                            <span className="font-semibold text-cyan-300">{module.solved}</span>
                          </div>
                          <div className="flex items-center justify-between text-amber-200/90">
                            <span>Remaining</span>
                            <span className="font-semibold text-amber-300">{module.remaining}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              <Card className="order-2 border-slate-800 bg-slate-950/85">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-100">Achievements That Keep You Practicing</CardTitle>
                  <CardDescription className="text-slate-400">
                    Compact milestone tracker for consistency and growth
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {achievements.map((achievement) => {
                    const percent = Math.min(
                      100,
                      Math.round((achievement.progress / achievement.target) * 100),
                    );
                    const Icon = achievement.icon;
                    const completed = achievement.progress >= achievement.target;

                    return (
                      <div
                        key={achievement.title}
                        className="rounded-xl border border-slate-800 bg-slate-900/50 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="rounded-md border border-slate-700 bg-slate-950/70 p-2">
                              <Icon className="h-4 w-4 text-slate-200" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-100">{achievement.title}</p>
                              <p className="mt-0.5 line-clamp-2 text-sm text-slate-400">
                                {achievement.description}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={completed ? "border-emerald-400/40 text-emerald-300" : "border-slate-600 text-slate-300"}
                          >
                            {completed ? "Done" : `${percent}%`}
                          </Badge>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs">
                          <span className={`rounded-md border px-2 py-1 ${achievement.tone}`}>
                            Progress {achievement.progress}/{achievement.target}
                          </span>
                          <span className="text-slate-500">Keep going</span>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </section>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
