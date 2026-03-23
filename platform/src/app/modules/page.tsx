"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/shared/navbar";
import { Sidebar } from "@/components/shared/sidebar";
import { ModuleCard } from "@/components/shared/module-card";
import { ProtectedRoute } from "@/components/shared/protected-route";
import { BookOpen, BookMarked, ChevronRight } from "lucide-react";

interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  concepts: Array<{ id: string; title: string; description: string }>;
  _count?: { questions: number };
}

export default function ModulesPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const router = useRouter();

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
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, []);

  const handleModuleClick = (moduleId: string) => {
    setExpandedModule(expandedModule === moduleId ? null : moduleId);
  };

  const handleStartModule = (moduleId: string) => {
    router.push(`/practice?moduleId=${moduleId}`);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen bg-slate-50">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <Navbar />
            <div className="flex-1 flex items-center justify-center">
              <p className="text-slate-600">Loading modules...</p>
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
          <div className="max-w-6xl mx-auto p-4 md:p-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
                <BookMarked className="w-10 h-10 text-blue-600" />
                All Modules
              </h1>
              <p className="text-slate-600 mt-2">
                Dive deep into OOPs and C++ with comprehensive modules
              </p>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {modules.map((module) => (
                <div key={module.id}>
                  <ModuleCard
                    id={module.id}
                    title={module.title}
                    description={module.description}
                    questionsCount={module._count?.questions || 0}
                    onClick={() => handleModuleClick(module.id)}
                  />

                  {/* Expanded Details */}
                  {expandedModule === module.id && (
                    <Card className="mt-4 border-l-4 border-l-blue-600">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Concepts in {module.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Concepts List */}
                        <div className="space-y-3">
                          {module.concepts && module.concepts.length > 0 ? (
                            module.concepts.map((concept) => (
                              <div
                                key={concept.id}
                                className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                              >
                                <ChevronRight className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <h4 className="font-medium text-slate-900">
                                    {concept.title}
                                  </h4>
                                  <p className="text-sm text-slate-600 mt-1">
                                    {concept.description}
                                  </p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-slate-600">
                              No concepts available yet
                            </p>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4 mt-4 border-t border-slate-200">
                          <Button
                            onClick={() => handleStartModule(module.id)}
                            className="flex-1"
                          >
                            Start Practice
                          </Button>
                          <Button variant="outline" className="flex-1">
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ))}
            </div>

            {/* Learning Path Info */}
            <Card className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                  Recommended Learning Path
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-slate-700">
                    Follow this sequence to master the concepts:
                  </p>
                  <ol className="space-y-2 list-decimal list-inside">
                    {modules.map((module, index) => (
                      <li key={module.id} className="text-slate-700">
                        <strong>{module.title}</strong> - {module.description}
                      </li>
                    ))}
                  </ol>
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-900">
                      💡 <strong>Tip:</strong> Complete each module sequentially
                      for best results. After completing all concepts, take an
                      AI-powered interview to test your knowledge!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
    </ProtectedRoute>
  );
}
