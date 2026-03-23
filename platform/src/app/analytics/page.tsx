"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/shared/navbar";
import { Sidebar } from "@/components/shared/sidebar";
import { ProtectedRoute } from "@/components/shared/protected-route";
import { useAuth } from "@/lib/auth-context";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Award, BookOpen, Zap, Calendar, Clock } from "lucide-react";

interface ModuleStats {
  name: string;
  attempted: number;
  completed: number;
  score: number;
}

export default function AnalyticsPage() {
  const { user } = useAuth();

  // Mock data - In production, this would come from API
  const moduleStats: ModuleStats[] = [
    { name: "OOPs Fundamentals", attempted: 5, completed: 3, score: 85 },
    { name: "C++ Basics", attempted: 3, completed: 2, score: 72 },
    { name: "Advanced OOPs", attempted: 2, completed: 1, score: 65 },
  ];

  const dailyProgress = [
    { date: "Mon", questions: 4, correct: 3 },
    { date: "Tue", questions: 6, correct: 5 },
    { date: "Wed", questions: 3, correct: 2 },
    { date: "Thu", questions: 8, correct: 7 },
    { date: "Fri", questions: 5, correct: 4 },
    { date: "Sat", questions: 2, correct: 2 },
    { date: "Sun", questions: 0, correct: 0 },
  ];

  const questionTypeData = [
    { name: "MCQ", value: 25 },
    { name: "Code", value: 15 },
  ];

  const COLORS = ["#3b82f6", "#10b981"];

  const stats = [
    {
      label: "Total Questions",
      value: "40",
      icon: <BookOpen className="w-6 h-6" />,
      color: "text-blue-600",
    },
    {
      label: "Accuracy",
      value: "82.5%",
      icon: <Award className="w-6 h-6" />,
      color: "text-amber-600",
    },
    {
      label: "Streak",
      value: "7 days",
      icon: <Zap className="w-6 h-6" />,
      color: "text-orange-600",
    },
    {
      label: "Total Time",
      value: "4.5 hrs",
      icon: <Clock className="w-6 h-6" />,
      color: "text-purple-600",
    },
  ];

  if (!user) return null;

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <main className="flex-1 overflow-auto">
            <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
              {/* Header */}
              <div>
                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                  Analytics & Progress
                </h1>
                <p className="text-slate-600 mt-2">
                  Track your learning journey and performance metrics
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-slate-600 flex items-center justify-between">
                        {stat.label}
                        <span className={`${stat.color}`}>{stat.icon}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Daily Progress */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Daily Progress</CardTitle>
                    <CardDescription>Questions answered this week</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={dailyProgress}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="date" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1e293b",
                            border: "1px solid #475569",
                            borderRadius: "8px",
                            color: "#f1f5f9",
                          }}
                        />
                        <Legend />
                        <Bar dataKey="questions" fill="#3b82f6" name="Questions" />
                        <Bar dataKey="correct" fill="#10b981" name="Correct" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Question Type Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Question Types</CardTitle>
                    <CardDescription>Breakdown by type</CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={questionTypeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {questionTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1e293b",
                            border: "1px solid #475569",
                            borderRadius: "8px",
                            color: "#f1f5f9",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Module Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Module Performance</CardTitle>
                  <CardDescription>Your progress in each module</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {moduleStats.map((module, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <p className="font-medium text-slate-900">{module.name}</p>
                          <Badge variant="outline">{module.score}%</Badge>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full h-8 bg-slate-200 rounded-lg overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-medium transition-all"
                            style={{ width: `${module.score}%` }}
                          >
                            {module.score > 20 && `${module.score}%`}
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-4 text-sm text-slate-600">
                          <span>Attempted: {module.attempted}</span>
                          <span>Completed: {module.completed}</span>
                          <span className="text-green-600">
                            Correct: {Math.round((module.completed * module.score) / 100)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Learning Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Learning Pace</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart
                        data={[
                          { week: "W1", cumulative: 5 },
                          { week: "W2", cumulative: 12 },
                          { week: "W3", cumulative: 18 },
                          { week: "W4", cumulative: 40 },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="week" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1e293b",
                            border: "1px solid #475569",
                            borderRadius: "8px",
                            color: "#f1f5f9",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="cumulative"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={{ fill: "#3b82f6", r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Achievements</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3 p-2 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg">
                      <span className="text-2xl">🌟</span>
                      <div>
                        <p className="font-medium text-slate-900">First Steps</p>
                        <p className="text-xs text-slate-600">Complete first question</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                      <span className="text-2xl">🎯</span>
                      <div>
                        <p className="font-medium text-slate-900">Perfect Week</p>
                        <p className="text-xs text-slate-600">7 consecutive days</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-slate-100 rounded-lg opacity-50">
                      <span className="text-2xl">🏆</span>
                      <div>
                        <p className="font-medium text-slate-900">Master</p>
                        <p className="text-xs text-slate-600">Complete all modules</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
