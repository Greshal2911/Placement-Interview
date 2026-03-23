"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Target } from "lucide-react";

interface ModuleCardProps {
  id: string;
  title: string;
  description: string;
  progress?: number;
  questionsCount?: number;
  completed?: boolean;
  onClick?: () => void;
}

export function ModuleCard({
  title,
  description,
  progress = 0,
  questionsCount = 0,
  completed = false,
  onClick,
}: ModuleCardProps) {
  return (
    <Card
      onClick={onClick}
      className="cursor-pointer hover:shadow-lg transition-shadow hover:border-blue-300"
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="mt-2">{description}</CardDescription>
          </div>
          {completed && (
            <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-600">Progress</span>
              <span className="text-sm font-bold text-slate-900">{progress}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              <span className="text-slate-600">{questionsCount} Questions</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="text-slate-600">2-3 hrs</span>
            </div>
          </div>

          {/* Badge */}
          <div className="flex gap-2">
            {completed && <Badge className="bg-green-100 text-green-800">Completed</Badge>}
            {!completed && progress > 0 && (
              <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
            )}
            {!completed && progress === 0 && (
              <Badge className="bg-slate-100 text-slate-800">Not Started</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
