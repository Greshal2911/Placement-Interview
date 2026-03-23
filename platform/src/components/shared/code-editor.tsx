"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Play, RotateCcw, ChevronDown } from "lucide-react";

interface TestCase {
  input: string;
  output: string;
  passed?: boolean;
}

interface CodeEditorProps {
  initialCode?: string;
  language?: string;
  testCases?: TestCase[];
  onSubmit?: (code: string) => void;
  problemStatement?: string;
}

export function CodeEditor({
  initialCode = `#include <iostream>
using namespace std;

int main() {
    // Write your code here
    cout << "Hello, World!" << endl;
    return 0;
}`,
  language = "cpp",
  testCases = [],
  onSubmit,
  problemStatement = "Complete the C++ program",
}: CodeEditorProps) {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [expandedTest, setExpandedTest] = useState<number | null>(null);

  const handleRun = async () => {
    setIsRunning(true);
    // In production, this would call a code execution service
    // For now, show a mock output
    setTimeout(() => {
      setOutput("Program executed successfully!\nOutput: Hello, World!");
      setIsRunning(false);
    }, 1000);
  };

  const handleReset = () => {
    setCode(initialCode);
    setOutput("");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="space-y-4">
      {/* Problem Statement */}
      {problemStatement && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg">Problem Statement</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700">{problemStatement}</p>
          </CardContent>
        </Card>
      )}

      {/* Code Editor */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Code Editor</CardTitle>
              <CardDescription>C++ Editor</CardDescription>
            </div>
            <Badge variant="outline">{language}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Editor Toolbar */}
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={handleCopy}>
              <Copy className="w-4 h-4 mr-1" />
              Copy
            </Button>
            <Button size="sm" variant="outline" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
            <Button size="sm" onClick={handleRun} disabled={isRunning}>
              <Play className="w-4 h-4 mr-1" />
              {isRunning ? "Running..." : "Run"}
            </Button>
          </div>

          {/* Code Editor Area */}
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-64 p-4 font-mono text-sm border border-slate-300 rounded-lg bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            spellCheck="false"
          />

          {/* Output Section */}
          {output && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-900">Output:</p>
              <div className="p-3 bg-slate-100 rounded-lg border border-slate-300 font-mono text-sm">
                <pre className="whitespace-pre-wrap text-slate-800">{output}</pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Cases */}
      {testCases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Test Cases</CardTitle>
            <CardDescription>
              {testCases.filter((t) => t.passed).length} / {testCases.length} passed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {testCases.map((testCase, index) => (
              <div
                key={index}
                className="border border-slate-200 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedTest(expandedTest === index ? null : index)
                  }
                  className="w-full p-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        expandedTest === index ? "rotate-180" : ""
                      }`}
                    />
                    <span className="text-sm font-medium text-slate-900">
                      Test Case {index + 1}
                    </span>
                    <Badge
                      className={
                        testCase.passed
                          ? "bg-green-100 text-green-800"
                          : "bg-slate-200 text-slate-800"
                      }
                    >
                      {testCase.passed ? "✓ Passed" : "○ Not Run"}
                    </Badge>
                  </div>
                </button>

                {expandedTest === index && (
                  <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-2">
                    <div>
                      <p className="text-xs font-medium text-slate-600 mb-1">
                        Input:
                      </p>
                      <pre className="p-2 bg-white rounded border border-slate-200 text-xs font-mono text-slate-800 overflow-x-auto">
                        {testCase.input}
                      </pre>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-600 mb-1">
                        Expected Output:
                      </p>
                      <pre className="p-2 bg-white rounded border border-slate-200 text-xs font-mono text-slate-800 overflow-x-auto">
                        {testCase.output}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <Button
        size="lg"
        className="w-full"
        onClick={() => onSubmit?.(code)}
      >
        Submit Solution
      </Button>
    </div>
  );
}
