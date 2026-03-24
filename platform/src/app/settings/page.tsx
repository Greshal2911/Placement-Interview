"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/shared/navbar";
import { ProtectedRoute } from "@/components/shared/protected-route";
import { useAuth } from "@/lib/auth-context";
import { Bell, Moon, Zap, Lock, Volume2, Eye } from "lucide-react";

interface Setting {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
}

export default function SettingsPage() {
  const { logout } = useAuth();
  const [settings, setSettings] = useState<Setting[]>([
    {
      id: "notifications",
      label: "Email Notifications",
      description: "Receive updates about your progress and achievements",
      icon: <Bell className="w-5 h-5" />,
      enabled: true,
    },
    {
      id: "dark-mode",
      label: "Dark Mode",
      description: "Use dark theme for reduced eye strain",
      icon: <Moon className="w-5 h-5" />,
      enabled: false,
    },
    {
      id: "sound",
      label: "Sound Effects",
      description: "Play sound notifications for interview questions",
      icon: <Volume2 className="w-5 h-5" />,
      enabled: true,
    },
    {
      id: "auto-save",
      label: "Auto-save Code",
      description: "Automatically save code exercises as you type",
      icon: <Zap className="w-5 h-5" />,
      enabled: true,
    },
    {
      id: "private",
      label: "Hide Progress",
      description: "Keep your progress private from other users",
      icon: <Eye className="w-5 h-5" />,
      enabled: false,
    },
  ]);

  const toggleSetting = (id: string) => {
    setSettings((prev) =>
      prev.map((setting) =>
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
      )
    );
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 overflow-auto">
          <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
              {/* Settings Header */}
              <div>
                <h1 className="text-3xl font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground mt-2">Manage your preferences and account settings</p>
              </div>

              {/* General Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-foreground">Preferences</CardTitle>
                  <CardDescription className="text-muted-foreground">Customize your experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {settings.map((setting) => (
                    <div key={setting.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="text-muted-foreground">{setting.icon}</div>
                        <div>
                          <p className="font-medium text-foreground">{setting.label}</p>
                          <p className="text-sm text-muted-foreground">{setting.description}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleSetting(setting.id)}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          setting.enabled ? "bg-primary" : "bg-muted"
                        } flex items-center padding-1`}
                      >
                        <div
                          className={`w-5 h-5 bg-foreground rounded-full transition-transform ${
                            setting.enabled ? "translate-x-6" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Learning Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-foreground">Learning Settings</CardTitle>
                  <CardDescription className="text-muted-foreground">Configure your learning experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                      Difficulty Level
                    </label>
                    <div className="flex gap-2">
                      {["Easy", "Medium", "Hard"].map((level) => (
                        <Button
                          key={level}
                          variant={level === "Medium" ? "default" : "outline"}
                          size="sm"
                        >
                          {level}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                      Questions Per Session
                    </label>
                    <div className="flex gap-2">
                      {[5, 10, 15].map((count) => (
                        <Button
                          key={count}
                          variant={count === 5 ? "default" : "outline"}
                          size="sm"
                        >
                          {count}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Privacy & Security */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Lock className="w-5 h-5" />
                    Privacy & Security
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">Manage your security settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    Change Password
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Enable Two-Factor Authentication
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    View Active Sessions
                  </Button>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="border-destructive/30 bg-destructive/10">
                <CardHeader>
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                  <CardDescription className="text-destructive/70">
                    Irreversible actions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="destructive" className="w-full">
                    Delete Account
                  </Button>
                  <Button
                    variant="outline"
                    onClick={logout}
                    className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
                  >
                    Logout from All Devices
                  </Button>
                </CardContent>
              </Card>

              {/* Footer */}
              <Card className="bg-primary/10 border-primary/20">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Version:</strong> 1.0.0 • <strong className="text-foreground">Last updated:</strong> {new Date().toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
