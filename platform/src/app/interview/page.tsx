"use client";

import React, { useEffect, useState } from "react";
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
import { useAuth } from "@/lib/auth-context";
import { BookOpen, Loader, ArrowRight } from "lucide-react";

const InterviewLayout = ({
  children,
  maxWidth = "max-w-5xl",
}: {
  children: React.ReactNode;
  maxWidth?: string;
}) => (
  <ProtectedRoute>
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 overflow-auto w-full">
        <div className={`${maxWidth} mx-auto p-4 md:p-8`}>{children}</div>
      </main>
    </div>
  </ProtectedRoute>
);

interface Module {
  id: string;
  title: string;
  description: string;
  _count?: {
    concepts?: number;
    questions?: number;
  };
}

export default function InterviewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<string>("");

  useEffect(() => {
    const fetchModules = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/modules");
        if (res.ok) {
          const data = await res.json();
          const nextModules = (data.data || []) as Module[];
          setModules(nextModules);
          if (nextModules.length > 0) {
            setSelectedModule(nextModules[0].id);
          }
        }
      } catch (error) {
        console.error("Error fetching modules:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, []);

  const goToRules = () => {
    if (!selectedModule) {
      alert("Please select a module");
      return;
    }

    router.push(`/interview/rules?moduleId=${selectedModule}`);
  };

  return (
    <InterviewLayout>
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary/80">Interview Setup</p>
          <h1 className="mt-2 text-4xl font-bold text-foreground">Choose Your Interview Topic</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Pick one module to begin. On the next step, you will review proctoring rules,
            time limit, and interview conditions before starting.
          </p>
        </div>

        {!user ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              Please log in to continue.
            </CardContent>
          </Card>
        ) : loading ? (
          <Card>
            <CardContent className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader className="h-5 w-5 animate-spin" /> Loading topics...
            </CardContent>
          </Card>
        ) : modules.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No modules found. Add modules first to start interviews.
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {modules.map((module) => {
                const active = selectedModule === module.id;

                return (
                  <button
                    key={module.id}
                    type="button"
                    onClick={() => setSelectedModule(module.id)}
                    className={`rounded-xl border p-5 text-left transition-all ${
                      active
                        ? "border-primary bg-primary/10 shadow-[0_0_0_1px_rgba(59,130,246,0.25)]"
                        : "border-border bg-card hover:border-primary/45"
                    }`}
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <p className="font-semibold text-foreground">{module.title}</p>
                    </div>
                    <p className="line-clamp-3 text-sm text-muted-foreground">{module.description}</p>
                    <div className="mt-4 flex gap-3 text-xs text-muted-foreground">
                      <span>{module._count?.concepts ?? 0} concepts</span>
                      <span>{module._count?.questions ?? 0} questions</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <Button
              onClick={goToRules}
              disabled={!selectedModule}
              className="w-full md:w-auto"
            >
              Continue to Rules
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </InterviewLayout>
  );
}
