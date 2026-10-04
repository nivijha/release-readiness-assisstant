import React, { useState } from "react";
import ReleaseForm from "../components/ReleaseForm";
import ValidationPanel from "../components/ValidationPanel";
import ImpactPanel from "../components/ImpactPanel";
import UnsupportedClaimsPanel from "../components/UnsupportedClaimsPanel";
import BriefPanel from "../components/BriefPanel";
import { api } from "../services/api";

const Dashboard = () => {
  const [validationResult, setValidationResult] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyzeRelease = async () => {
    setIsAnalyzing(true);

    try {
      const response = await api.analyzeRelease({
        version: "v2.4.0",
        title: "Data Import and Export Improvements",
        releaseDate: "2026-10-03",
        completedFeatures: "",
        bugFixes: "",
        changedBehaviour: "",
        qaSummary: "",
        knownLimitations: "",
        migrationNotes: "",
        affectedUserGroups: "",
      });

      setAnalysisResult(response.analysis);
    } catch (error) {
      console.error("Analysis error:", error);
      setAnalysisResult({
        impactAnalysis: [],
        missingInformation: [],
        unsupportedClaims: [],
        risks: [],
        internalSummary: {
          text: "AI analysis could not be completed.",
          evidence: [],
        },
        stakeholderSummary: {
          text: "AI analysis could not be completed.",
          evidence: [],
        },
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">
              Release Communication & Readiness Assistant
            </h1>
            <p className="text-sm text-gray-500">
              Prepare, review, and communicate release changes.
            </p>
          </div>
        </div>
      </nav>

      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Release Package */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Release Package
              </h2>
              <ReleaseForm
                onValidate={(result) => setValidationResult(result)}
                onCreate={() => {}}
              />
            </div>

            {/* Readiness Analysis */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Readiness Analysis
              </h2>
              <ValidationPanel
                validationResult={validationResult}
              />
            </div>
          </div>

          {/* AI Analysis Section */}
          {validationResult && validationResult.isValid ? (
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h2 className="text-xl font-medium text-gray-900 mb-4">
                Release Analysis
              </h2>

              {isAnalyzing ? (
                <p className="text-sm text-gray-500">
                  Analyzing release changes, QA evidence, risks, and stakeholder impact...
                </p>
              ) : analysisResult ? (
                <div>
                  <button
                    onClick={handleAnalyzeRelease}
                    disabled={isAnalyzing}
                    className="
                      px-4 py-2 bg-indigo-600 text-white font-medium rounded-md
                      hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500
                      disabled:opacity-50 disabled:cursor-not-allowed
                    "
                  >
                    {isAnalyzing
                      ? "Analyzing Release..."
                      : "Analyze Release"}
                  </button>

                  <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Impact Panel */}
                    <ImpactPanel analysis={analysisResult} />

                    {/* Unsupported Claims Panel */}
                    <UnsupportedClaimsPanel analysis={analysisResult} />
                  </div>

                  {/* Brief Panel */}
                  <BriefPanel analysis={analysisResult} />
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Complete all required release sections and click "Analyze Release"
                  to generate AI-powered insights.
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Complete all required release sections and click "Analyze Release"
              to generate AI-powered insights.
            </p>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;