"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { load as loadTfjsFaceDetector } from "@tensorflow-models/face-detection/dist/tfjs/detector";
import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import { Navbar } from "@/components/shared/navbar";
import { ProtectedRoute } from "@/components/shared/protected-route";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader, Send, Timer, Video } from "lucide-react";

type FinalizeReason =
  | "TIME_LIMIT_REACHED"
  | "MANUAL_SUBMIT"
  | "MULTIPLE_FACES_DETECTED"
  | "USER_NOT_VISIBLE_2S";

type FaceDetectorEngine = "tfjs" | "native";

type FaceEstimator = {
  estimateFaces: (source: HTMLVideoElement) => Promise<Array<unknown>>;
  dispose?: () => void;
  engine: FaceDetectorEngine;
};

type NativeFaceDetectorCtor = new (options?: {
  fastMode?: boolean;
  maxDetectedFaces?: number;
}) => {
  detect: (source: HTMLVideoElement) => Promise<Array<unknown>>;
};

interface InterviewQuestion {
  question: string;
  userResponse?: string;
  evaluation?: {
    score: number;
    feedback: string;
  };
}

interface InterviewData {
  id: string;
  module: {
    title: string;
  };
  qnaLog: InterviewQuestion[];
  score?: number | null;
  feedback?: string | null;
}

const InterviewLayout = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 overflow-auto w-full">
        <div className="max-w-6xl mx-auto p-4 md:p-8">{children}</div>
      </main>
    </div>
  </ProtectedRoute>
);

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

export default function InterviewTestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const interviewId = searchParams.get("interviewId") || "";
  const moduleId = searchParams.get("moduleId") || "";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interview, setInterview] = useState<InterviewData | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(600);
  const [isFinalized, setIsFinalized] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [finalFeedback, setFinalFeedback] = useState<string>("");
  const [faceMonitoring, setFaceMonitoring] = useState<"unsupported" | "active" | "idle">("idle");
  const [faceDetectorEngine, setFaceDetectorEngine] = useState<FaceDetectorEngine | null>(null);
  const [lastFaceCount, setLastFaceCount] = useState<number | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceMonitorIntervalRef = useRef<number | null>(null);
  const faceDetectorRef = useRef<FaceEstimator | null>(null);
  const detectorInitializingRef = useRef(false);
  const autoCompletedByFaceRef = useRef(false);
  const noFaceSinceRef = useRef<number | null>(null);
  const detectionInFlightRef = useRef(false);

  const tryCreateNativeDetector = (): FaceEstimator | null => {
    const detectorCtor = (
      window as Window & {
        FaceDetector?: NativeFaceDetectorCtor;
      }
    ).FaceDetector;

    if (!detectorCtor) {
      return null;
    }

    const detector = new detectorCtor({ fastMode: true, maxDetectedFaces: 5 });
    return {
      estimateFaces: (source: HTMLVideoElement) => detector.detect(source),
      engine: "native",
    };
  };

  const currentQuestion = questions[currentQuestionIndex];
  const questionCount = Math.max(questions.length, 1);
  const progressPercent = Math.min(100, Math.round(((currentQuestionIndex + 1) / questionCount) * 100));

  useEffect(() => {
    if (!interviewId || !moduleId) {
      router.replace("/interview");
      return;
    }

    const guardRaw = sessionStorage.getItem("interview-guard");
    if (!guardRaw) {
      router.replace(`/interview/rules?moduleId=${moduleId}`);
      return;
    }

    try {
      const guard = JSON.parse(guardRaw) as { moduleId?: string; camera?: boolean; microphone?: boolean };
      if (!guard.camera || !guard.microphone || guard.moduleId !== moduleId) {
        router.replace(`/interview/rules?moduleId=${moduleId}`);
      }
    } catch {
      router.replace(`/interview/rules?moduleId=${moduleId}`);
    }
  }, [interviewId, moduleId, router]);

  useEffect(() => {
    const bootstrap = async () => {
      if (!interviewId) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [mediaStream, interviewRes] = await Promise.all([
          navigator.mediaDevices.getUserMedia({ video: true, audio: true }),
          fetch(`/api/interviews/${interviewId}`),
        ]);

        streamRef.current = mediaStream;
        setCameraStream(mediaStream);
        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = mediaStream;
        }

        if (!faceDetectorRef.current && !detectorInitializingRef.current) {
          detectorInitializingRef.current = true;

          try {
            await tf.ready();
            try {
              await tf.setBackend("webgl");
            } catch {
              // Keep current backend if WebGL backend is unavailable.
            }

            const tfjsDetector = await loadTfjsFaceDetector({
              runtime: "tfjs",
              modelType: "short",
              maxFaces: 5,
            });

            faceDetectorRef.current = {
              estimateFaces: (source: HTMLVideoElement) =>
                tfjsDetector.estimateFaces(source, { flipHorizontal: true }),
              dispose: () => tfjsDetector.dispose(),
              engine: "tfjs",
            };
            setFaceDetectorEngine("tfjs");
          } catch {
            faceDetectorRef.current = tryCreateNativeDetector();
            setFaceDetectorEngine(faceDetectorRef.current?.engine ?? null);
          } finally {
            detectorInitializingRef.current = false;
          }
        }

        if (!faceDetectorRef.current) {
          setFaceMonitoring("unsupported");
        } else {
          setFaceMonitoring("active");

          faceMonitorIntervalRef.current = window.setInterval(async () => {
            if (isFinalized || autoCompletedByFaceRef.current || !cameraVideoRef.current) {
              return;
            }

            try {
              const video = cameraVideoRef.current;
              if (!video || video.readyState < 2 || detectionInFlightRef.current) {
                return;
              }

              detectionInFlightRef.current = true;

              const faces = await faceDetectorRef.current?.estimateFaces(video);
              if (!faces) {
                detectionInFlightRef.current = false;
                return;
              }

              setLastFaceCount(faces.length);

              if (faces.length > 1) {
                autoCompletedByFaceRef.current = true;
                setError("Multiple people detected in camera frame. Interview auto-submitted.");
                void finalizeInterview("MULTIPLE_FACES_DETECTED");
                detectionInFlightRef.current = false;
                return;
              }

              if (faces.length === 0) {
                const now = Date.now();
                if (noFaceSinceRef.current === null) {
                  noFaceSinceRef.current = now;
                } else if (now - noFaceSinceRef.current >= 2000) {
                  autoCompletedByFaceRef.current = true;
                  setError("User not visible in camera for 2 seconds. Interview auto-submitted.");
                  void finalizeInterview("USER_NOT_VISIBLE_2S");
                }
              } else {
                noFaceSinceRef.current = null;
              }
            } catch {
              // Ignore intermittent detector errors and continue monitoring.
            } finally {
              detectionInFlightRef.current = false;
            }
          }, 1000);
        }

        if (!interviewRes.ok) {
          throw new Error("Failed to load interview session");
        }

        const payload = await interviewRes.json();
        const data = payload.data as InterviewData;
        setInterview(data);
        setQuestions(Array.isArray(data.qnaLog) ? data.qnaLog : []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to initialize interview");
      } finally {
        setLoading(false);
      }
    };

    bootstrap();

    return () => {
      if (faceMonitorIntervalRef.current !== null) {
        window.clearInterval(faceMonitorIntervalRef.current);
        faceMonitorIntervalRef.current = null;
      }
      noFaceSinceRef.current = null;
      detectionInFlightRef.current = false;
      if (faceDetectorRef.current?.dispose) {
        faceDetectorRef.current.dispose();
      }
      faceDetectorRef.current = null;
      setFaceDetectorEngine(null);
      setLastFaceCount(null);
      setCameraStream(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [interviewId, isFinalized]);

  useEffect(() => {
    const video = cameraVideoRef.current;
    const stream = cameraStream;

    if (!video || !stream) {
      return;
    }

    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }

    const ensurePlayback = () => {
      void video.play().catch(() => {
        // Some browsers delay autoplay until metadata is ready.
      });
    };

    ensurePlayback();
    video.onloadedmetadata = ensurePlayback;
    video.oncanplay = ensurePlayback;

    return () => {
      video.onloadedmetadata = null;
      video.oncanplay = null;
    };
  }, [cameraStream, loading]);

  useEffect(() => {
    if (loading || isFinalized) {
      return;
    }

    if (secondsLeft <= 0) {
      void finalizeInterview("TIME_LIMIT_REACHED");
      return;
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((previous) => previous - 1);
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [loading, isFinalized, secondsLeft]);

  const submitAnswer = async () => {
    if (!answer.trim() || !interviewId || submitting || isFinalized) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/interviews/${interviewId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionIndex: currentQuestionIndex,
          userResponse: answer,
        }),
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.message || "Failed to submit answer");
      }

      const updatedQuestions = [...questions];
      updatedQuestions[currentQuestionIndex] = {
        ...updatedQuestions[currentQuestionIndex],
        userResponse: answer,
        evaluation: payload.data.currentEvaluation,
      };
      setQuestions(updatedQuestions);
      setAnswer("");

      if (payload.data.isComplete) {
        setIsFinalized(true);
        setFinalScore(typeof payload.data.interview?.score === "number" ? payload.data.interview.score : 0);
        setFinalFeedback(payload.data.interview?.feedback || "Interview completed.");
      } else if (currentQuestionIndex < updatedQuestions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to submit answer");
    } finally {
      setSubmitting(false);
    }
  };

  const finalizeInterview = async (reason: FinalizeReason) => {
    if (!interviewId || isFinalized) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/interviews/${interviewId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.message || "Failed to complete interview");
      }

      const updatedInterview = payload.data as InterviewData;
      setIsFinalized(true);
      setFinalScore(typeof updatedInterview.score === "number" ? updatedInterview.score : 0);
      setFinalFeedback(
        updatedInterview.feedback ||
          (reason === "TIME_LIMIT_REACHED"
            ? "Time limit reached. Final score generated from answered questions."
            : reason === "MULTIPLE_FACES_DETECTED"
              ? "Interview auto-submitted because multiple faces were detected."
              : reason === "USER_NOT_VISIBLE_2S"
                ? "Interview auto-submitted because user was not visible for 2 seconds."
            : "Interview completed."),
      );
      setInterview(updatedInterview);
      if (Array.isArray(updatedInterview.qnaLog)) {
        setQuestions(updatedInterview.qnaLog);
      }
    } catch (completeError) {
      setError(completeError instanceof Error ? completeError.message : "Failed to complete interview");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <InterviewLayout>
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <Loader className="h-5 w-5 animate-spin" /> Preparing interview...
          </CardContent>
        </Card>
      ) : error && !interview ? (
        <Card className="border-red-400/50 bg-red-500/10">
          <CardContent className="py-8 text-center text-red-200">
            {error}
            <div className="mt-4">
              <Button onClick={() => router.push("/interview")}>Go Back</Button>
            </div>
          </CardContent>
        </Card>
      ) : isFinalized ? (
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-3">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>
            <CardTitle className="text-3xl">Interview Completed</CardTitle>
            <CardDescription>{interview?.module?.title}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <p className="text-sm text-muted-foreground">Final AI Score</p>
              <p className="mt-1 text-5xl font-bold text-foreground">{finalScore ?? 0}/10</p>
              <p className="mt-3 text-sm text-muted-foreground">{finalFeedback}</p>
            </div>

            <div className="space-y-3">
              {questions.map((question, index) => (
                <div key={`${question.question}-${index}`} className="rounded-lg border border-border p-4">
                  <p className="font-medium text-foreground">Q{index + 1}: {question.question}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Answer: {question.userResponse || "Not answered"}
                  </p>
                  {question.evaluation && (
                    <p className="mt-2 text-sm text-foreground">
                      <Badge variant="secondary">Score: {question.evaluation.score}/10</Badge>
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
              <Button variant="outline" onClick={() => router.push("/interview")}>Take Another Interview</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-primary/80">Step 3 of 3</p>
              <h1 className="text-2xl font-bold text-foreground">{interview?.module?.title || "Interview"}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-1.5 text-amber-200">
                <Timer className="h-4 w-4" />
                <span className="font-semibold">{formatTime(secondsLeft)}</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {faceMonitoring === "active"
                  ? "Face monitoring active"
                  : faceMonitoring === "unsupported"
                    ? "Face monitoring unsupported"
                    : "Face monitoring idle"}
              </Badge>
              {faceDetectorEngine && (
                <Badge variant="secondary" className="text-xs uppercase">
                  {faceDetectorEngine} detector
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                Faces: {lastFaceCount ?? "-"}
              </Badge>
            </div>
          </div>

          <div className="w-full rounded-full bg-muted h-2">
            <div
              className="h-2 rounded-full bg-linear-to-r from-primary to-secondary transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {error && (
            <Card className="border-red-400/50 bg-red-500/10">
              <CardContent className="py-3 text-sm text-red-200">{error}</CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">
                Question {currentQuestionIndex + 1} of {questionCount}
              </CardTitle>
              <CardDescription>{currentQuestion?.question}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                placeholder="Write your answer here..."
                className="h-40 w-full resize-none rounded-lg border border-border bg-card p-4 text-foreground outline-none focus:border-primary"
                disabled={submitting}
              />

              <div className="flex flex-wrap gap-3">
                <Button onClick={submitAnswer} disabled={!answer.trim() || submitting}>
                  {submitting ? "Submitting..." : (
                    <>
                      <Send className="mr-2 h-4 w-4" /> Submit Answer
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (currentQuestionIndex < questions.length - 1) {
                      setCurrentQuestionIndex((prev) => prev + 1);
                      setAnswer("");
                    }
                  }}
                  disabled={currentQuestionIndex >= questions.length - 1 || submitting}
                >
                  Next Question
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => void finalizeInterview("MANUAL_SUBMIT")}
                  disabled={submitting}
                >
                  Finish Interview Now
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="fixed right-4 top-24 z-40 w-64 overflow-hidden rounded-xl border border-border bg-black shadow-2xl">
            <div className="flex items-center justify-between border-b border-border bg-slate-900/90 px-3 py-2 text-xs text-slate-200">
              <span className="inline-flex items-center gap-1">
                <Video className="h-3.5 w-3.5" /> Live Camera Feed
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
            </div>
            <video
              ref={cameraVideoRef}
              autoPlay
              muted
              playsInline
              onLoadedData={() => {
                const video = cameraVideoRef.current;
                if (!video) {
                  return;
                }

                void video.play().catch(() => {
                  // Keep silent; autoplay behavior differs by browser.
                });
              }}
              className="aspect-video w-full bg-black object-cover"
            />
          </div>
        </div>
      )}
    </InterviewLayout>
  );
}
