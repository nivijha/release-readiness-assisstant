import React, { useEffect, useState } from "react";
import ReleaseForm from "../components/ReleaseForm";
import ValidationPanel from "../components/ValidationPanel";
import VersionHistory from "../components/VersionHistory";
import StaleStatementDetection from "../components/StaleStatementDetection";
import FinalReviewedBrief from "../components/FinalReviewedBrief";
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

const toReleaseFormData = (release) => {
  const packageData = release?.package || {};
  const asText = (value) =>
    Array.isArray(value) ? value.join("\n") : typeof value === "string" ? value : "";
  return {
    version: release?.version || "",
    title: release?.title || "",
    releaseDate: release?.releaseDate || "",
    completedFeatures: asText(packageData.completedFeatures),
    bugFixes: asText(packageData.bugFixes),
    changedBehaviour: asText(packageData.changedBehaviour),
    qaSummary: asText(packageData.qaSummary),
    knownLimitations: asText(packageData.knownLimitations),
    migrationNotes: asText(packageData.migrationNotes),
    affectedUserGroups: asText(packageData.affectedUserGroups),
  };
};

const InternalSummary = ({
  analysis,
  onSaveReview,
  editedValue,
  setEditedValue,
}) => {
  const internalSummary =
    typeof analysis?.internalSummary?.text === "string"
      ? analysis?.internalSummary?.text
      : "";

  const handleSave = async () => {
    if (onSaveReview && editedValue) {
      await onSaveReview(editedValue, /* stakeholderSummary */ "");
    }
  };

  return (
    <div>
      <h3 className="mb-2 text-base font-semibold text-gray-900">
        Internal Summary
      </h3>
      <textarea
        rows={4}
        className="min-h-28 w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm leading-6 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        value={editedValue || internalSummary}
        onChange={(e) => setEditedValue(e.target.value)}
        placeholder="Technical summary for developers, QA, and release managers..."
        disabled={false}
      />

      {internalSummary.length > 0 && (
        <div className="mt-3 text-xs text-gray-400">
          <strong>Evidence:</strong>
          {analysis?.internalSummary?.evidence?.map((ev, i) => (
            <div key={i} className="mb-1">
              • {ev}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const StakeholderSummary = ({
  analysis,
  onSaveReview,
  editedValue,
  setEditedValue,
}) => {
  const stakeholderSummary =
    typeof analysis?.stakeholderSummary?.text === "string"
      ? analysis?.stakeholderSummary?.text
      : "";

  const handleSave = async () => {
    if (onSaveReview && editedValue) {
      await onSaveReview(/* internalSummary */ "", editedValue);
    }
  };

  return (
    <div>
      <h3 className="mb-2 text-base font-semibold text-gray-900">
        Stakeholder Summary
      </h3>
      <textarea
        rows={4}
        className="min-h-28 w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm leading-6 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        value={editedValue || stakeholderSummary}
        onChange={(e) => setEditedValue(e.target.value)}
        placeholder="Client-friendly summary for stakeholders and non-technical users..."
        disabled={false}
      />

      {stakeholderSummary.length > 0 && (
        <div className="mt-3 text-xs text-gray-400">
          <strong>Evidence:</strong>
          {analysis?.stakeholderSummary?.evidence?.map((ev, i) => (
            <div key={i} className="mb-1">
              • {ev}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Dashboard = () => {
  const [validationResult, setValidationResult] = useState(null);
  const [createdRelease, setCreatedRelease] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [editedInternalSummary, setEditedInternalSummary] = useState("");
  const [editedStakeholderSummary, setEditedStakeholderSummary] = useState("");
  const [reviewSaved, setReviewSaved] = useState(false);
  const [isSavingReview, setIsSavingReview] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [releaseStatus, setReleaseStatus] = useState("draft");
  const [validationError, setValidationError] = useState("");
  const [createError, setCreateError] = useState("");
  const [analysisError, setAnalysisError] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSavingPackage, setIsSavingPackage] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [showCreateVersion, setShowCreateVersion] = useState(false);
  const [activeReleaseError, setActiveReleaseError] = useState("");
  const [activeReleaseLoaded, setActiveReleaseLoaded] = useState(false);
  const currentStatus = createdRelease?.status || releaseStatus || "";
  const isApproved = currentStatus.toLowerCase() === "approved";

  useEffect(() => {
    let isCurrent = true;

    const restoreActiveRelease = async () => {
      try {
        const activeReleaseId = window.localStorage.getItem(
          "release-readiness-active-release-id"
        );
        let release = null;

        if (activeReleaseId) {
          const body = getResponseBody(await api.getRelease(activeReleaseId));
          release = body?.release;
        } else {
          const body = getResponseBody(await api.getReleases());
          release = body?.releases?.[0] || null;
        }

        if (!isCurrent || !isRecord(release)) return;

        const restoredAnalysis = normalizeAnalysis(release.analysis);
        const hasAnalysis =
          Boolean(restoredAnalysis.internalSummary.text) ||
          restoredAnalysis.impactAnalysis.length > 0 ||
          restoredAnalysis.risks.length > 0;
        const hasSavedReview =
          Boolean(release.review?.reviewedAt) &&
          typeof release.review?.internalSummary === "string" &&
          typeof release.review?.stakeholderSummary === "string";

        setCreatedRelease(release);
        setAnalysis(hasAnalysis ? restoredAnalysis : null);
        setEditedInternalSummary(
          release.review?.internalSummary ||
            restoredAnalysis.internalSummary.text
        );
        setEditedStakeholderSummary(
          release.review?.stakeholderSummary ||
            restoredAnalysis.stakeholderSummary.text
        );
        setReviewSaved(hasSavedReview);
        setReleaseStatus(
          release.status === "approved" || release.status === "rejected"
            ? release.status
            : hasAnalysis
              ? "analyzed"
              : "draft"
        );

        const validationBody = getResponseBody(
          await api.validateRelease(toReleaseFormData(release))
        );
        if (isCurrent) {
          setValidationResult(
            validationBody?.validation || validationBody?.data?.validation || null
          );
        }
      } catch (error) {
        if (isCurrent) {
          setActiveReleaseError(
            getErrorMessage(error, "Unable to restore the active release.")
          );
        }
      } finally {
        if (isCurrent) setActiveReleaseLoaded(true);
      }
    };

    restoreActiveRelease();
    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    if (createdRelease?.releaseId) {
      window.localStorage.setItem(
        "release-readiness-active-release-id",
        createdRelease.releaseId
      );
    }
  }, [createdRelease?.releaseId]);

  const handlePackageChange = () => {
    setValidationResult(null);
    setAnalysis(null);
    setReviewSaved(false);
    setReleaseStatus("draft");
    setAnalysisError("");
  };

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
      setActiveReleaseError("");
      setAnalysis(null);
      setAnalysisError("");
      setEditedInternalSummary("");
      setEditedStakeholderSummary("");
      setReviewSaved(false);
      setReleaseStatus("draft");
      setValidationResult(validationResult);
    } catch (error) {
      setCreateError(getErrorMessage(error, "Failed to create release."));
    } finally {
      setIsCreating(false);
    }
  };

  const handleSavePackage = async (releaseData) => {
    if (!createdRelease?.releaseId || isSavingPackage) return false;

    setIsSavingPackage(true);
    setCreateError("");
    try {
      const body = getResponseBody(
        await api.updateDraftRelease(createdRelease.releaseId, releaseData)
      );
      const updatedRelease = body?.release;
      if (body?.success === false || !isRecord(updatedRelease)) {
        throw new Error(body?.message || "Failed to save draft package.");
      }

      setCreatedRelease(updatedRelease);
      setValidationResult(body.validation || null);
      setAnalysis(null);
      setReviewSaved(false);
      setReleaseStatus("draft");
      setEditedInternalSummary("");
      setEditedStakeholderSummary("");
      setAnalysisError("");
      return true;
    } catch (error) {
      setCreateError(getErrorMessage(error, "Failed to save draft package."));
      return false;
    } finally {
      setIsSavingPackage(false);
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
    setAnalysis(null);
    setReviewSaved(false);

    try {
      const saved = await handleSavePackage(releaseData);
      if (!saved) return;

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

      const normalizedAnalysis = normalizeAnalysis(analysisResponse);
      setAnalysis(normalizedAnalysis);
      setEditedInternalSummary(normalizedAnalysis.internalSummary.text);
      setEditedStakeholderSummary(
        normalizedAnalysis.stakeholderSummary.text
      );
      setReviewSaved(false);
      setReleaseStatus("analyzed");
    } catch (error) {
      setAnalysisError(
        getErrorMessage(error, "Unable to analyze the release.")
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveReview = async (internalSummary, stakeholderSummary) => {
    if (!analysis || !createdRelease?.releaseId || isSavingReview) return;

    setIsSavingReview(true);
    try {
      const body = getResponseBody(
        await api.saveReview(createdRelease.releaseId, {
          internalSummary,
          stakeholderSummary,
        })
      );
      if (body.success === false) {
        throw new Error(body.message || "Save failed");
      }
      setReviewSaved(true);
      setEditedInternalSummary(internalSummary);
      setEditedStakeholderSummary(stakeholderSummary);
      if (isRecord(body.release)) {
        setCreatedRelease((currentRelease) => ({
          ...currentRelease,
          ...body.release,
        }));
      }
    } catch (error) {
      setAnalysisError(
        getErrorMessage(error, "Failed to save review.")
      );
    } finally {
      setIsSavingReview(false);
    }
  };

  const handleApproveRelease = async () => {
    if (!analysis || !reviewSaved || !createdRelease?.releaseId || isApproving) {
      return;
    }

    setIsApproving(true);
    try {
      const body = getResponseBody(
        await api.approveRelease(createdRelease.releaseId)
      );
      if (body.success === false) {
        throw new Error(body.message || "Approve failed");
      }
      setReleaseStatus("approved");
      setCreatedRelease((currentRelease) => ({
        ...currentRelease,
        ...(isRecord(body.release) ? body.release : {}),
        status: "approved",
      }));
    } catch (error) {
      setAnalysisError(
        getErrorMessage(error, "Failed to approve release.")
      );
    } finally {
      setIsApproving(false);
    }
  };

const handleRejectRelease = async () => {
    if (!createdRelease?.releaseId || isRejecting) return;

    setIsRejecting(true);
    try {
      const body = getResponseBody(
        await api.rejectRelease(createdRelease.releaseId, rejectionReason)
      );
      if (body.success === false) {
        throw new Error(body.message || "Reject failed");
      }
      setReleaseStatus("rejected");
      setCreatedRelease((currentRelease) => ({
        ...currentRelease,
        ...(isRecord(body.release) ? body.release : {}),
        status: "rejected",
      }));
      setRejectionReason("");
    } catch (error) {
      setAnalysisError(
        getErrorMessage(error, "Failed to reject release.")
      );
    } finally {
      setIsRejecting(false);
    }
  };

  const handleCreateVersion = async () => {
    if (
      !createdRelease?.releaseId ||
      !isApproved ||
      isCreatingVersion
    ) {
      return;
    }

    setIsCreatingVersion(true);
    try {
      const result = getResponseBody(
        await api.createNewVersion(createdRelease.releaseId)
      );
      if (result?.success === false || !isRecord(result?.release)) {
        throw new Error(result?.message || "Failed to create new version.");
      }
      // Switch UI to the new version by resetting state
      setCreatedRelease(result.release);
      setAnalysis(null);
      setValidationError("");
      setCreateError("");
      setValidationResult(null);
      setEditedInternalSummary("");
      setEditedStakeholderSummary("");
      setReviewSaved(false);
      setReleaseStatus("draft");
      setAnalysisError("");
      setShowCreateVersion(false);
      const validationBody = getResponseBody(
        await api.validateRelease(toReleaseFormData(result.release))
      );
      setValidationResult(
        validationBody?.validation || validationBody?.data?.validation || null
      );
    } catch (error) {
      setAnalysisError(
        getErrorMessage(error, "Failed to create new version.")
      );
    } finally {
      setIsCreatingVersion(false);
    }
  };

  const footerMessage = analysis
    ? "Review the generated analysis before approving the release."
    : createdRelease
      ? "Release created as draft. Analyze the release to generate AI-powered insights."
      : validationResult?.isValid
        ? "Release package is ready to be created."
        : "Complete all required release sections and validate the release.";

  const statusDisplay = () => {
    const status =
      releaseStatus === "analyzed" ? "in review" : currentStatus || "draft";
    const statusClasses =
      status === "approved"
        ? "border-green-200 bg-green-50 text-green-800"
        : status === "rejected"
          ? "border-red-200 bg-red-50 text-red-800"
          : status === "in review"
            ? "border-indigo-200 bg-indigo-50 text-indigo-800"
            : "border-blue-200 bg-blue-50 text-blue-800";

    return (
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <span
          className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${statusClasses}`}
        >
          {status}
        </span>
        {releaseStatus === "analyzed" && (
          <span className="text-sm text-gray-600">
            AI analysis is ready for human review.
          </span>
        )}
        {releaseStatus === "rejected" && rejectionReason && (
          <span className="text-sm text-gray-600">
            Reason: {rejectionReason}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex min-h-16 flex-col justify-center gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-lg font-semibold text-gray-900 sm:text-xl">
              Release Communication & Readiness Assistant
            </h1>
            <p className="text-sm text-gray-500 sm:text-right">
              Prepare, review, and communicate release changes.
            </p>
          </div>
        </div>
      </nav>

      <main className="py-6 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <div>
              <h2 className="mb-3 text-lg font-semibold text-gray-900">
                Release Package
              </h2>
              <ReleaseForm
                key={createdRelease?.releaseId || "new-release"}
                validationResult={validationResult}
                createdRelease={createdRelease}
                validationError={validationError}
                createError={createError}
                isValidating={isValidating}
                isCreating={isCreating}
                isSavingPackage={isSavingPackage}
                isAnalyzing={isAnalyzing}
                onValidate={handleValidate}
                onCreate={handleCreate}
                onSavePackage={handleSavePackage}
                onPackageChange={handlePackageChange}
                onAnalyze={handleAnalyzeRelease}
              />
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-gray-900">
                Readiness Analysis
              </h2>
              <ValidationPanel
                validationResult={validationResult}
                validationError={validationError}
                analysis={analysis}
                isAnalyzing={isAnalyzing}
                analysisError={analysisError}
              />

              {statusDisplay()}

      {activeReleaseError && (
        <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {activeReleaseError}
        </p>
      )}

      {createdRelease && (
        <div className="mt-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <button
            onClick={() => setShowCreateVersion(true)}
            disabled={!createdRelease || !isApproved || isCreatingVersion}
            className="min-h-11 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Create New Version
          </button>

          {showCreateVersion && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={handleCreateVersion}
                disabled={isCreatingVersion}
                className="min-h-11 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCreatingVersion ? "Creating..." : "Create Version"}
              </button>
              <button
                onClick={() => setShowCreateVersion(false)}
                className="min-h-11 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {activeReleaseLoaded && createdRelease?.releaseId && (
        <VersionHistory
          key={createdRelease.releaseId}
          releaseId={createdRelease.releaseId}
          activeReleaseId={createdRelease.releaseId}
          refreshKey={createdRelease.status}
        />
      )}
      {createdRelease && <StaleStatementDetection
        key={createdRelease?.releaseId || "new-release"}
        releaseId={createdRelease?.releaseId}
      />}
      {createdRelease && <FinalReviewedBrief release={createdRelease} />}

      {analysis && releaseStatus !== "approved" && releaseStatus !== "rejected" && (
                <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Human Review
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Review and edit the AI-generated summaries, save your review, then approve or reject.
                  </p>
                  <div className="my-4 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <span className="rounded-full bg-gray-100 px-3 py-1.5">AI analysis</span>
                    <span aria-hidden="true">→</span>
                    <span className="rounded-full bg-gray-100 px-3 py-1.5">Edit</span>
                    <span aria-hidden="true">→</span>
                    <span className="rounded-full bg-gray-100 px-3 py-1.5">Save review</span>
                    <span aria-hidden="true">→</span>
                    <span className="rounded-full bg-gray-100 px-3 py-1.5">Approve / reject</span>
                  </div>
                  <InternalSummary
                    analysis={analysis}
                    onSaveReview={handleSaveReview}
                    editedValue={editedInternalSummary}
                    setEditedValue={(value) => {
                      setEditedInternalSummary(value);
                      setReviewSaved(false);
                    }}
                  />
                  <StakeholderSummary
                    analysis={analysis}
                    onSaveReview={handleSaveReview}
                    editedValue={editedStakeholderSummary}
                    setEditedValue={(value) => {
                      setEditedStakeholderSummary(value);
                      setReviewSaved(false);
                    }}
                  />
                  <button
                    onClick={() =>
                      handleSaveReview(
                        editedInternalSummary,
                        editedStakeholderSummary
                      )
                    }
                    disabled={isSavingReview}
                    className="mt-4 min-h-11 rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSavingReview ? "Saving..." : "Save Review"}
                  </button>
                </section>
              )}

              {analysis &&
                reviewSaved &&
                releaseStatus !== "approved" &&
                releaseStatus !== "rejected" && (
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={handleApproveRelease}
                    disabled={isApproving}
                    className="min-h-11 rounded-lg bg-green-700 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isApproving ? "Approving..." : "Approve Release"}
                  </button>
                  <button
                    onClick={handleRejectRelease}
                    disabled={isRejecting}
                    className="min-h-11 rounded-lg border border-red-200 bg-white px-5 py-2.5 font-semibold text-red-700 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isRejecting ? "Rejecting..." : "Reject Release"}
                  </button>
                </div>
              )}

            </div>
          </div>

          <p className="mt-6 border-t border-gray-200 pt-4 text-sm text-gray-500" aria-live="polite">
            {footerMessage}
          </p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;