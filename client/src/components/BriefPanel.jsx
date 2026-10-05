import React, { useState } from "react";

const BriefPanel = ({ analysis, onSaveReview }) => {
  const [internalEdited, setInternalEdited] = useState(false);
  const [stakeholderEdited, setStakeholderEdited] = useState(false);

  const internalSummary =
    typeof analysis?.internalSummary?.text === "string"
      ? analysis?.internalSummary?.text
      : "";
  const stakeholderSummary =
    typeof analysis?.stakeholderSummary?.text === "string"
      ? analysis?.stakeholderSummary?.text
      : "";
  const internalEvidence = Array.isArray(analysis?.internalSummary?.evidence)
    ? analysis?.internalSummary?.evidence
    : [];
  const stakeholderEvidence = Array.isArray(
    analysis?.stakeholderSummary?.evidence
  )
    ? analysis?.stakeholderSummary?.evidence
    : [];

  const handleSaveReview = async () => {
    if (onSaveReview) {
      await onSaveReview(
        internalSummary,
        stakeholderSummary
      );
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <h2 className="mb-4 text-base font-semibold text-gray-900">
        Release Summaries
      </h2>

      <div className="space-y-4">
        {/* Internal Technical Brief */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-2 font-semibold text-gray-900">
            Internal Summary
          </h3>

          <textarea
            rows={4}
            className="
              w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm leading-6 focus:border-indigo-500
              focus:outline-none focus:ring-2 focus:ring-indigo-200
              {internalEdited ? '' : 'bg-gray-50'}
            "
            value={internalSummary}
            onChange={(e) => setInternalEdited(true)}
            placeholder="Technical summary for developers, QA, and release managers..."
            disabled={!internalEdited}
          />

          {internalEvidence.length > 0 && (
            <div className="mt-3 text-xs text-gray-400">
              <strong>Evidence:</strong>
              {internalEvidence.map((ev, i) => (
                <div key={i} className="mb-1">
                  • {ev}
                </div>
              ))}
            </div>
          )}

          {!internalEdited && (
            <button
              onClick={handleSaveReview}
              className="
                mt-2 px-3 py-1 text-sm font-medium text-indigo-600 rounded-md hover:bg-indigo-100
              "
            >
              Save Changes
            </button>
          )}
        </div>

        {/* Stakeholder / Client Brief */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-2 font-semibold text-gray-900">
            Stakeholder Summary
          </h3>

          <textarea
            rows={4}
            className="
              w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm leading-6 focus:border-indigo-500
              focus:outline-none focus:ring-2 focus:ring-indigo-200
              {stakeholderEdited ? '' : 'bg-gray-50'}
            "
            value={stakeholderSummary}
            onChange={(e) => setStakeholderEdited(true)}
            placeholder="Client-friendly summary for stakeholders and non-technical users..."
            disabled={!stakeholderEdited}
          />

          {stakeholderEvidence.length > 0 && (
            <div className="mt-3 text-xs text-gray-400">
              <strong>Evidence:</strong>
              {stakeholderEvidence.map((ev, i) => (
                <div key={i} className="mb-1">
                  • {ev}
                </div>
              ))}
            </div>
          )}

          {!stakeholderEdited && (
            <button
              onClick={handleSaveReview}
              className="
                mt-2 px-3 py-1 text-sm font-medium text-indigo-600 rounded-md hover:bg-indigo-100
              "
            >
              Save Changes
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BriefPanel;