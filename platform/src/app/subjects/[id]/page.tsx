"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/shared/navbar";
import { ModuleCard } from "@/components/shared/module-card";
import { ProtectedRoute } from "@/components/shared/protected-route";
import { BookOpen, BookMarked, ChevronRight, Library, ArrowLeft, Layers } from "lucide-react";

interface Subject {
  id: string;
  title: string;
  description: string;
  modules: Module[];
}

interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  concepts: Array<{ id: string; title: string; description: string }>;
  _count?: { questions: number };
}

export default function SubjectModulesPage() {
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  
  useEffect(() => {
    const fetchSubject = async () => {
      try {
        const id = params.id;
        const res = await fetch(`/api/subjects/${id}`);
        if (res.ok) {
          const data = await res.json();
          setSubject(data.data);
        }
      } catch (error) {
        console.error("Error fetching subject details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchSubject();
    }
  }, [params.id]);

  const handleModuleClick = (moduleId: string) => {
    setExpandedModule(expandedModule === moduleId ? null : moduleId);
  };

  const handleStartModule = (moduleId: string) => {
    router.push(`/practice?moduleId=${moduleId}`);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background flex flex-col">
          <Navbar />
          <main className="flex-1 w-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              <p className="text-muted-foreground animate-pulse">Loading modules...</p>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (!subject) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background flex flex-col">
          <Navbar />
          <main className="flex-1 w-full flex items-center justify-center">
            <div className="text-center p-8 max-w-md w-full bg-card rounded-xl border border-border shadow-lg">
              <Library className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-foreground mb-4">Subject Not Found</h2>
              <p className="text-muted-foreground mb-8">The subject you're looking for doesn't exist or has been removed.</p>
              <Button onClick={() => router.push('/subjects')} className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Subjects
              </Button>
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
            <div className="mb-4">
              <Button 
                variant="ghost" 
                className="hover:bg-primary/10 text-muted-foreground hover:text-primary pl-0"
                onClick={() => router.push('/subjects')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Subjects
              </Button>
            </div>
            
            {/* Header */}
            <div className="mb-10 pb-8 border-b border-border">
              <h1 className="text-4xl font-extrabold text-foreground flex items-center gap-4 tracking-tight">
                <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                  <BookMarked className="w-10 h-10 text-primary" />
                </div>
                {subject.title}
              </h1>
              <p className="text-muted-foreground mt-4 text-lg max-w-3xl">
                {subject.description}
              </p>
            </div>

            {/* Modules Grid */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Layers className="w-6 h-6 text-primary" />
                Available Modules
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {subject.modules && subject.modules.length > 0 ? (
                  subject.modules.map((module) => (
                    <div key={module.id} className="flex flex-col">
                      <ModuleCard
                        id={module.id}
                        title={module.title}
                        description={module.description}
                        questionsCount={module._count?.questions || 0}
                        onClick={() => handleModuleClick(module.id)}
                      />

                      {/* Expanded Details */}
                      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedModule === module.id ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                        <Card className="border-l-4 border-l-primary bg-card/60 backdrop-blur-sm">
                          <CardHeader className="pb-3 border-b border-border/50 bg-background/30">
                            <CardTitle className="text-lg text-foreground flex items-center gap-2">
                              <BookOpen className="w-5 h-5 text-primary" />
                              Concepts inside this module
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4 pt-4">
                            <div className="space-y-2">
                              {module.concepts && module.concepts.length > 0 ? (
                                module.concepts.map((concept) => (
                                  <div
                                    key={concept.id}
                                    className="flex items-start gap-4 p-3.5 bg-background rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-colors group"
                                  >
                                    <div className="bg-primary/10 p-1.5 rounded-md group-hover:bg-primary/20 transition-colors">
                                      <ChevronRight className="w-4 h-4 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-foreground">
                                        {concept.title}
                                      </h4>
                                      <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                                        {concept.description}
                                      </p>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-muted-foreground italic px-4 py-6 text-center border border-dashed border-border rounded-lg bg-background/50">
                                  No concepts available yet
                                </p>
                              )}
                            </div>

                            <div className="pt-4 border-t border-border">
                              <Button
                                onClick={() => handleStartModule(module.id)}
                                className="w-full py-6 text-lg rounded-xl hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all font-bold tracking-wide"
                              >
                                Start Practice Session
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center p-12 border border-dashed border-border rounded-xl bg-card">
                    <p className="text-lg text-muted-foreground">No modules added to this subject yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Learning Path Info */}
            {subject.modules && subject.modules.length > 0 && (
              <Card className="mt-12 bg-gradient-to-r from-[rgba(15,20,25,0)] to-[rgba(59,130,246,0.05)] border-l-4 border-l-secondary relative overflow-hidden backdrop-blur-sm">
                <div className="absolute -right-10 -top-10 text-secondary/10">
                  <Library className="w-48 h-48" />
                </div>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground font-bold text-xl relative z-10">
                    <BookOpen className="w-6 h-6 text-secondary" />
                    Recommended Protocol
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="space-y-4">
                    <ol className="space-y-3 list-decimal list-inside text-foreground ml-2">
                      {subject.modules.map((module) => (
                        <li key={module.id} className="pl-2 marker:text-primary font-medium">
                          <strong>{module.title}</strong>
                        </li>
                      ))}
                    </ol>
                    <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-xl flex gap-4 items-start shadow-sm">
                      <div className="bg-primary p-2 rounded-full hidden sm:block">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <div>
                        <p className="text-foreground leading-relaxed">
                          💡 <strong className="text-primary">Important:</strong> Complete each module sequentially. After submitting all required code, you will unlock an <strong>AI-powered Mock Interview</strong> which assesses your final score for this subject!
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
