"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/shared/navbar";
import { ProtectedRoute } from "@/components/shared/protected-route";
import { useAuth } from "@/lib/auth-context";
import { Sparkles, ShieldCheck } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  const stats = [
    { label: "Modules Completed", value: "04", detail: "2 in progress" },
    { label: "Questions Solved", value: "128", detail: "94% accuracy" },
    { label: "Interviews Simulated", value: "03", detail: "Gemini coach" },
  ];

  const focusAreas = [
    { title: "C++ STL Deep Dive", level: "Advanced", eta: "2h" },
    { title: "AI Interview Prep", level: "Medium", eta: "40m" },
  ];

  const timeline = [
    {
      title: "Joined Placement Lab",
      description: "Started the learning path with OOPs basics",
      date: "Jan 12",
    },
    {
      title: "Completed Module 3",
      description: "Mastered encapsulation, inheritance, and polymorphism",
      date: "Jan 18",
    },
    {
      title: "80% mock exam",
      description: "Practiced 20 MCQs plus 2 code challenges",
      date: "Jan 20",
    },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col">
        <Navbar />
        <main className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
              <section className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-8 shadow-2xl">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="space-y-3">
                    <p className="text-sm uppercase tracking-[0.4em] text-slate-500">
                      Active Learner
                    </p>
                    <h1 className="text-4xl lg:text-5xl font-semibold">
                      {user.name}
                    </h1>
                    <p className="text-slate-300 max-w-2xl">
                      {user.name} is leveling up on OOPs and C++ with a steady
                      pace of practice questions, in-depth concepts, and live
                      Gemini interview rehearsals.
                    </p>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-emerald-500 text-slate-900">
                        Gemini Coach
                      </Badge>
                      <Badge className="bg-blue-500 text-slate-900">
                        C++ Focus
                      </Badge>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-900/60 border border-slate-800 px-6 py-4 space-y-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                      Weekly Goal
                    </p>
                    <p className="text-3xl font-bold">80% target</p>
                    <div className="h-3 rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-emerald-400"
                        style={{ width: "62%" }}
                      />
                    </div>
                    <p className="text-xs text-slate-400">
                      6/9 objectives completed
                    </p>
                  </div>
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-3">
                {stats.map((stat) => (
                  <Card
                    key={stat.label}
                    className="bg-slate-900/80 border border-slate-800"
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-slate-400">
                        {stat.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-3xl font-semibold">{stat.value}</p>
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        {stat.detail}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </section>

              <section className="grid lg:grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-blue-900/60 to-indigo-900/60 border border-emerald-500/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Sparkles className="w-5 h-5 text-emerald-300" />{" "}
                      Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {timeline.map((item) => (
                      <div key={item.title} className="space-y-1">
                        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
                          {item.date}
                        </p>
                        <p className="text-md font-semibold">{item.title}</p>
                        <p className="text-sm text-slate-200">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/90 border border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-300" />{" "}
                      Account Security
                    </CardTitle>
                    <p className="text-xs text-slate-400">
                      Password last updated never
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-center"
                      size="sm"
                    >
                      Change Password
                    </Button>
                    <p className="text-sm text-slate-400">
                      Enable 2FA once supported for extra coverage.
                    </p>
                  </CardContent>
                </Card>
              </section>

              <section className="grid md:grid-cols-2 gap-4">
                {focusAreas.map((focus) => (
                  <Card
                    key={focus.title}
                    className="bg-slate-900/80 border border-slate-800 space-y-3"
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">{focus.title}</CardTitle>
                      <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
                        {focus.level}
                      </p>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                      <p className="text-sm text-slate-200">
                        Estimated {focus.eta}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-200 border-slate-700"
                      >
                        Continue
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </section>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
