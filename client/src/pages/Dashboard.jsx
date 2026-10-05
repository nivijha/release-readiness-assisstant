import React, { useState } from "react";
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
      <h3 className="text-semibold text-gray-900 mb-2">
        Internal Summary
      </h3>
      <textarea
        rows={4}
        className="
          w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none
          focus:ring-2 focus:ring-indigo-500 resize-none text-sm
          bg-gray-50
        "
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
      <h3 className="text-semibold text-gray-900 mb-2">
        Stakeholder Summary
      </h3>
      <textarea
        rows={4}
        className="
          w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none
          focus:ring-2 focus:ring-indigo-500 resize-none text-sm
          bg-gray-50
        "
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [newVersion, setNewVersion] = useState("");
  const [showCreateVersion, setShowCreateVersion] = useState(false);
  const currentStatus = createdRelease?.status || releaseStatus || "";
  const isApproved = currentStatus.toLowerCase() === "approved";

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
      setEditedInternalSummary("");
      setEditedStakeholderSummary("");
      setReviewSaved(false);
      setReleaseStatus("draft");
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
    setAnalysis(null);
    setReviewSaved(false);

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
      isCreatingVersion ||
      !newVersion.trim()
    ) {
      return;
    }

    setIsCreatingVersion(true);
    try {
      const result = await api.createNewVersion(createdRelease.releaseId, { version: newVersion.trim() });
      // Switch UI to the new version by resetting state
      setCreatedRelease(result.release);
      setAnalysis(null);
      setEditedInternalSummary("");
      setEditedStakeholderSummary("");
      setReviewSaved(false);
      setReleaseStatus("draft");
      setShowCreateVersion(false);
      setNewVersion("");
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
    if (releaseStatus === "approved") {
      return (
        <div className="mt-6 p-4 rounded-md bg-green-100 border-green-400">
          <p className="font-medium text-green-800">
            ✅ APPROVED
          </p>
          <p className="text-sm text-green-600">
            Release has been approved and is ready for publication.
          </p>
        </div>
      );
    }

    if (releaseStatus === "rejected") {
      return (
        <div className="mt-6 p-4 rounded-md bg-red-100 border-red-400">
          <p className="font-medium text-red-800">
            ❌ REJECTED
          </p>
          {rejectionReason && (
            <p className="text-sm text-red-600">
              Reason: {rejectionReason}
            </p>
          )}
          <p className="text-sm text-red-600">
            Release has been rejected.
          </p>
        </div>
      );
    }

    if (releaseStatus === "analyzed") {
      return (
        <div className="mt-6 p-4 rounded-md bg-indigo-100 border-indigo-400">
          <p className="font-medium text-indigo-800">
            Analysis Complete — Awaiting Review
          </p>
          <p className="text-sm text-indigo-600">
            AI analysis finished. Review and edit the summaries below.
          </p>
        </div>
      );
    }

    return null;
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

{statusDisplay()}

      {createdRelease && (
        <div className="mt-4">
          <button
            onClick={() => setShowCreateVersion(true)}
            disabled={!createdRelease || !isApproved || isCreatingVersion}
            className="mb-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create New Version
          </button>

          {showCreateVersion && (
            <div className="mt-3">
              <input
                type="text"
                value={newVersion}
                onChange={(e) => setNewVersion(e.target.value)}
                placeholder="v2.4.1"
                className="w-full px-3 py-2 border rounded-md mb-2"
              />
              <button
                onClick={handleCreateVersion}
                disabled={isCreatingVersion}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingVersion ? "Creating..." : "Create Version"}
              </button>
              {createdRelease && !isCreatingVersion && !isApproved && (
                <p className="mt-2 text-sm text-red-600">
                  Create New Version is only available for approved releases.
                </p>
              )}
              {createdRelease && isCreatingVersion && !isApproved && (
                <p className="mt-2 text-sm text-red-600">
                  Cannot create new version: release is not approved.
                </p>
              )}
              <button
                onClick={() => setShowCreateVersion(false)}
                className="mt-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      <VersionHistory releaseId={createdRelease?.releaseId} />
      <StaleStatementDetection releaseId={createdRelease?.releaseId} />
      {createdRelease && <FinalReviewedBrief release={createdRelease} />}

      {analysis && releaseStatus !== "approved" && releaseStatus !== "rejected" && (
                <div className="mt-6 p-4 rounded-md bg-yellow-50 border-yellow-200">
                  <h3 className="font-medium text-yellow-800 mb-2">Release Readiness</h3>
                  <p className="text-sm text-yellow-700">
                    Analysis completed successfully.
                  </p>
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
                    className="
                      mt-4 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-md
                      hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500
                      disabled:opacity-50 disabled:cursor-not-allowed
                    "
                  >
                    {isSavingReview ? "Saving..." : "Save Review"}
                  </button>
                </div>
              )}

              {analysis &&
                reviewSaved &&
                releaseStatus !== "approved" &&
                releaseStatus !== "rejected" && (
                <div className="mt-6">
                  <button
                    onClick={handleApproveRelease}
                    disabled={isApproving}
                    className="
                      mt-2 px-6 py-2.5 bg-green-600 text-white font-medium rounded-md
                      hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500
                      disabled:opacity-50 disabled:cursor-not-allowed
                    "
                  >
                    {isApproving ? "Approving..." : "Approve Release"}
                  </button>
                  <button
                    onClick={handleRejectRelease}
                    disabled={isRejecting}
                    className="
                      mt-2 px-6 py-2.5 bg-red-600 text-white font-medium rounded-md
                      hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500
                      disabled:opacity-50 disabled:cursor-not-allowed
                    "
                  >
                    {isRejecting ? "Rejecting..." : "Reject Release"}
                  </button>
                </div>
              )}

              {releaseStatus === "approved" && (
                <div className="mt-6 p-4 rounded-md bg-green-100 border-green-400">
                  <p className="font-medium text-green-800">
                    ✅ Release approved
                  </p>
                  <p className="text-sm text-green-600">
                    The release has been approved and is ready for publication.
                  </p>
                </div>
              )}

              {releaseStatus === "rejected" && (
                <div className="mt-6 p-4 rounded-md bg-red-100 border-red-400">
                  <p className="font-medium text-red-800">
                    ❌ Release rejected
                  </p>
                  {rejectionReason && (
                    <p className="text-sm text-red-600">Reason: {rejectionReason}</p>
                  )}
                  <p className="text-sm text-red-600">
                    The release has been rejected.
                  </p>
                </div>
              )}
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