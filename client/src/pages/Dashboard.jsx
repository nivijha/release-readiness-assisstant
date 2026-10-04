import React, { useState } from "react";
import ReleaseForm from "../components/ReleaseForm";
import ValidationPanel from "../components/ValidationPanel";
import { api } from "../services/api";

const isRecord = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const getResponseBody = (response) =>
  isRecord(response?.data) ? response.data : response;

const normalizeAnalysis = (value) => {
  const result = isRecord(value) ? value : {};
  const normalizeSummary = (summary) => {
    const normalized = isRecord(summary) ? summary : {};
    return {
      ...normalized,
      text: typeof normalized.text === "string" ? normalized.text : "",
      evidence: Array.isArray(normalized.evidence)
        ? normalized.evidence
        : [],
    };
  };

  return {
    ...result,
    impactAnalysis: Array.isArray(result.impactAnalysis)
      ? result.impactAnalysis
      : [],
    missingInformation: Array.isArray(result.missingInformation)
      ? result.missingInformation
      : [],
    unsupportedClaims: Array.isArray(result.unsupportedClaims)
      ? result.unsupportedClaims
      : [],
    risks: Array.isArray(result.risks) ? result.risks : [],
    internalSummary: normalizeSummary(result.internalSummary),
    stakeholderSummary: normalizeSummary(result.stakeholderSummary),
  };
};

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

const Dashboard = () => {
  const [validationResult, setValidationResult] = useState(null);
  const [createdRelease, setCreatedRelease] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [createError, setCreateError] = useState("");
  const [analysisError, setAnalysisError] = useState("");

  const handleValidate = async (releaseData) => {
    setIsValidating(true);
    setValidationError("");

    try {
      const body = getResponseBody(await api.validateRelease(releaseData));
      const validation =
        body?.validation || body?.data?.validation || null;

      if (!validation) {
        throw new Error(body?.message || "Validation response was incomplete.");
      }

      setValidationResult(validation);
    } catch (error) {
      setValidationError(
        getErrorMessage(error, "Unable to validate the release package.")
      );
      setValidationResult(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleCreate = async (releaseData) => {
    if (isCreating || !validationResult?.isValid) return;

    setIsCreating(true);
    setCreateError("");

    try {
      const body = getResponseBody(await api.createRelease(releaseData));
      const release = body?.release || body?.data?.release;

      if (body?.success === false || !isRecord(release)) {
        throw new Error(body?.message || "Release creation failed.");
      }

      setCreatedRelease({
        ...release,
        version: release.version ?? releaseData.version ?? "",
        releaseId: release.releaseId ?? "",
        status: release.status ?? "draft",
        package: isRecord(release.package) ? release.package : releaseData,
        analysis: isRecord(release.analysis) ? release.analysis : {},
      });
      setAnalysis(null);
      setAnalysisError("");
    } catch (error) {
      setCreateError(getErrorMessage(error, "Failed to create release."));
    } finally {
      setIsCreating(false);
    }
  };

  const handleAnalyzeRelease = async (releaseData) => {
    if (
      isAnalyzing ||
      !validationResult?.isValid ||
      !createdRelease?.releaseId
    ) {
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError("");

    try {
      const body = getResponseBody(
        await api.analyzeRelease({
          ...releaseData,
          version: createdRelease.version,
          releaseId: createdRelease.releaseId,
        })
      );
      const analysisResponse =
        body?.analysis || body?.data?.analysis || null;

      if (body?.success === false || !isRecord(analysisResponse)) {
        throw new Error(body?.message || "Analysis response was incomplete.");
      }

      setAnalysis(normalizeAnalysis(analysisResponse));
    } catch (error) {
      setAnalysisError(
        getErrorMessage(error, "Unable to analyze the release.")
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const footerMessage = analysis
    ? "Review the generated analysis before approving the release."
    : createdRelease
      ? "Release created as draft. Analyze the release to generate AI-powered insights."
      : validationResult?.isValid
        ? "Release package is ready to be created."
        : "Complete all required release sections and validate the release.";

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
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Release Package
              </h2>
              <ReleaseForm
                validationResult={validationResult}
                createdRelease={createdRelease}
                validationError={validationError}
                createError={createError}
                isValidating={isValidating}
                isCreating={isCreating}
                isAnalyzing={isAnalyzing}
                onValidate={handleValidate}
                onCreate={handleCreate}
                onAnalyze={handleAnalyzeRelease}
              />
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Readiness Analysis
              </h2>
              <ValidationPanel
                validationResult={validationResult}
                validationError={validationError}
                analysis={analysis}
                isAnalyzing={isAnalyzing}
                analysisError={analysisError}
              />
            </div>
          </div>

          <p className="mt-6 text-sm text-gray-500" aria-live="polite">
            {footerMessage}
          </p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
