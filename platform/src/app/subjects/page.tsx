"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/shared/navbar";
import { ProtectedRoute } from "@/components/shared/protected-route";
import { Library, ArrowRight, BookOpen, Layers } from "lucide-react";

interface Subject {
  id: string;
  title: string;
  description: string;
  order: number;
  _count?: { modules: number };
}

// Consistent colors for cards
const cardColors = [
  "card-blue",
  "card-teal",
  "card-purple",
  "card-copper",
  "card-gold"
];

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await fetch("/api/subjects");
        if (res.ok) {
          const data = await res.json();
          setSubjects(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching subjects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  const handleStartSubject = (subjectId: string) => {
    router.push(`/subjects/${subjectId}`);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background flex flex-col">
          <Navbar />
          <main className="flex-1 w-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              <p className="text-muted-foreground animate-pulse">Loading subjects...</p>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 w-full overflow-auto">
          <div className="max-w-6xl mx-auto p-4 md:p-8">
            <div className="mb-10 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-extrabold text-foreground flex items-center justify-center md:justify-start gap-4 tracking-tight">
                <Library className="w-10 h-10 md:w-12 md:h-12 text-primary" />
                Course Subjects
              </h1>
              <p className="text-muted-foreground mt-4 text-lg max-w-3xl">
                Master core computer science concepts. Choose a curriculum track below to explore modules, practice coding, and prepare for your AI interview.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {subjects.map((subject, index) => {
                const colorClass = cardColors[index % cardColors.length];
                return (
                  <Card key={subject.id} className={`${colorClass} flex flex-col h-full transform hover:-translate-y-1 transition-all duration-300`}>
                    <CardHeader>
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-xl bg-background/50 border border-border shadow-sm">
                          <BookOpen className="w-6 h-6 text-primary" />
                        </div>
                        <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold border border-primary/20">
                          {subject._count?.modules || 0} Modules
                        </div>
                      </div>
                      <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                        {subject.title}
                      </CardTitle>
                      <CardDescription className="text-base text-muted-foreground mt-2 line-clamp-3">
                        {subject.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="mt-auto pt-6 flex gap-3">
                      <Button 
                        onClick={() => handleStartSubject(subject.id)} 
                        className="w-full flex items-center justify-center gap-2 py-6 rounded-xl hover:shadow-primary/20 hover:shadow-lg transition-all"
                      >
                        <Layers className="w-5 h-5" />
                        Explore Modules
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            {subjects.length === 0 && (
              <div className="text-center p-12 border border-dashed border-border rounded-xl bg-card">
                <Library className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-bold text-foreground">No subjects found</h3>
                <p className="text-muted-foreground mt-2">Check back later or contact your instructor.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
