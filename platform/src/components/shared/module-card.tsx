"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  variant?: "copper" | "purple" | "teal" | "gold" | "blue";
}

export function ModuleCard({
  id,
  title,
  description,
  progress = 0,
  questionsCount = 0,
  completed = false,
  onClick,
  variant,
}: ModuleCardProps) {
  // Auto-select variant based on ID hash if not provided
  const cardVariants = ["copper", "purple", "teal", "gold", "blue"] as const;
  const selectedVariant =
    variant || cardVariants[id.charCodeAt(0) % cardVariants.length];

  const variantClasses = {
    copper: "card-copper",
    purple: "card-purple",
    teal: "card-teal",
    gold: "card-gold",
    blue: "card-blue",
  };

  const accentColorMap = {
    copper: "from-amber-600 to-orange-600",
    purple: "from-purple-600 to-violet-600",
    teal: "from-teal-600 to-cyan-600",
    gold: "from-amber-500 to-yellow-600",
    blue: "from-blue-600 to-indigo-600",
  };

  return (
    <Card
      onClick={onClick}
      className={`cursor-pointer transition-all duration-300 border-0 ${variantClasses[selectedVariant]}`}
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl md:text-2xl font-semibold text-foreground">
              {title}
            </CardTitle>
            <CardDescription className="mt-2 text-muted-foreground">
              {description}
            </CardDescription>
          </div>
          {completed && (
            <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Progress
              </span>
              <span className="text-sm font-bold text-foreground">
                {progress}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-300 bg-linear-to-r ${accentColorMap[selectedVariant]}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">
                {questionsCount} Questions
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">2-3 hrs</span>
            </div>
          </div>

          {/* Badge */}
          <div className="flex gap-2">
            {completed && (
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Completed
              </Badge>
            )}
            {!completed && progress > 0 && (
              <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30">
                In Progress
              </Badge>
            )}
            {!completed && progress === 0 && (
              <Badge className="bg-muted text-muted-foreground border border-border">
                Not Started
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
