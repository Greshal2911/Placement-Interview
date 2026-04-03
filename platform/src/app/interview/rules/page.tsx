"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/shared/navbar";
import { ProtectedRoute } from "@/components/shared/protected-route";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Mic, ShieldCheck, Timer, Loader } from "lucide-react";

type PermissionState = "idle" | "requesting" | "granted" | "denied";

interface ModuleData {
  id: string;
  title: string;
  description: string;
}

const InterviewLayout = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 overflow-auto w-full">
        <div className="max-w-4xl mx-auto p-4 md:p-8">{children}</div>
      </main>
    </div>
  </ProtectedRoute>
);

function InterviewRulesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const moduleId = searchParams.get("moduleId") || "";

  const [moduleData, setModuleData] = useState<ModuleData | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [startingInterview, setStartingInterview] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cameraStatus, setCameraStatus] = useState<PermissionState>("idle");
  const [audioStatus, setAudioStatus] = useState<PermissionState>("idle");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const fetchModule = async () => {
      if (!moduleId) {
        setPageLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/modules/${moduleId}`);
        if (!res.ok) {
          throw new Error("Could not load selected module");
        }

        const payload = await res.json();
        setModuleData(payload.data);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Failed to load module details",
        );
      } finally {
        setPageLoading(false);
      }
    };

    fetchModule();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [moduleId]);

  const requestMediaPermissions = async () => {
    setErrorMessage(null);
    setCameraStatus("requesting");
    setAudioStatus("requesting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;
      setCameraStatus("granted");
      setAudioStatus("granted");
    } catch {
      setCameraStatus("denied");
      setAudioStatus("denied");
      setErrorMessage("Camera and microphone access are required to continue.");
    }
  };

  const startInterview = async () => {
    if (!user?.id) {
      setErrorMessage("Please log in before starting an interview.");
      return;
    }

    if (!moduleId) {
      setErrorMessage("Please select a topic first.");
      return;
    }

    if (cameraStatus !== "granted" || audioStatus !== "granted") {
      setErrorMessage(
        "Camera and microphone must be active before continuing.",
      );
      return;
    }

    if (!termsAccepted) {
      setErrorMessage("Please accept terms and conditions.");
      return;
    }

    setStartingInterview(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, moduleId }),
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.message || "Failed to start interview");
      }

      sessionStorage.setItem(
        "interview-guard",
        JSON.stringify({
          moduleId,
          camera: true,
          microphone: true,
          acceptedAt: Date.now(),
        }),
      );

      router.push(
        `/interview/test?moduleId=${moduleId}&interviewId=${payload.data.interviewId}`,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to start interview",
      );
    } finally {
      setStartingInterview(false);
    }
  };

  const canContinue =
    cameraStatus === "granted" &&
    audioStatus === "granted" &&
    termsAccepted &&
    !!moduleId &&
    !!user?.id;

  return (
    <InterviewLayout>
      {pageLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <Loader className="h-5 w-5 animate-spin" /> Loading rules...
          </CardContent>
        </Card>
      ) : !moduleData ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Invalid topic selection. Please choose a module again.
            <div className="mt-4">
              <Button onClick={() => router.push("/interview")}>
                Back to Topic Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary/80">
              Step 2 of 3
            </p>
            <h1 className="mt-2 text-3xl font-bold text-foreground">
              Interview Rules and Conditions
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Topic selected:{" "}
              <span className="font-semibold text-foreground">
                {moduleData.title}
              </span>
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Test Regulations</CardTitle>
              <CardDescription>
                Read carefully before proceeding to the interview window.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-3">
                  <Camera className="h-4 w-4 text-primary" />
                  Camera detection must remain enabled throughout test.
                </div>
                <Badge
                  variant={cameraStatus === "granted" ? "secondary" : "outline"}
                >
                  {cameraStatus}
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-3">
                  <Mic className="h-4 w-4 text-primary" />
                  Audio detection must remain enabled throughout test.
                </div>
                <Badge
                  variant={audioStatus === "granted" ? "secondary" : "outline"}
                >
                  {audioStatus}
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-3">
                  <Timer className="h-4 w-4 text-primary" />
                  Total interview time limit is 10 minutes.
                </div>
                <Badge variant="outline">10:00</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  AI evaluates each answer and computes your final score.
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={requestMediaPermissions}
              disabled={
                cameraStatus === "requesting" || audioStatus === "requesting"
              }
            >
              {cameraStatus === "requesting" || audioStatus === "requesting"
                ? "Checking devices..."
                : "Enable Camera and Microphone"}
            </Button>
            <label className="inline-flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(event) => setTermsAccepted(event.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              I accept the interview terms and conditions.
            </label>
          </div>

          {errorMessage && (
            <Card className="border-red-400/50 bg-red-500/10">
              <CardContent className="py-3 text-sm text-red-200">
                {errorMessage}
              </CardContent>
            </Card>
          )}

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => router.push("/interview")}>
              Back
            </Button>
            <Button
              onClick={startInterview}
              disabled={!canContinue || startingInterview}
            >
              {startingInterview
                ? "Starting interview..."
                : "Accept and Continue to Test"}
            </Button>
          </div>
        </div>
      )}
    </InterviewLayout>
  );
}

export default function InterviewRulesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <InterviewRulesPageContent />
    </Suspense>
  );
}
