import React, { useState } from "react";

const BriefPanel = ({ analysis, onSaveReview }) => {
  const [internalEdited, setInternalEdited] = useState(false);
  const [stakeholderEdited, setStakeholderEdited] = useState(false);

  const internalSummary =
    typeof analysis?.internalSummary?.text === "string"
      ? analysis.internalSummary.text
      : "";
  const stakeholderSummary =
    typeof analysis?.stakeholderSummary?.text === "string"
      ? analysis.stakeholderSummary.text
      : "";
  const internalEvidence = Array.isArray(analysis?.internalSummary?.evidence)
    ? analysis.internalSummary.evidence
    : [];
  const stakeholderEvidence = Array.isArray(
    analysis?.stakeholderSummary?.evidence
  )
    ? analysis.stakeholderSummary.evidence
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
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-medium text-gray-900 mb-4">
        Release Summaries
      </h2>

      <div className="space-y-4">
        {/* Internal Technical Brief */}
        <div>
          <h3 className="text-semibold text-gray-900 mb-2">
            Internal Summary
          </h3>

          <textarea
            rows={4}
            className="
              w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none
              focus:ring-2 focus:ring-indigo-500 resize-none text-sm
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
        <div>
          <h3 className="text-semibold text-gray-900 mb-2">
            Stakeholder Summary
          </h3>

          <textarea
            rows={4}
            className="
              w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none
              focus:ring-2 focus:ring-indigo-500 resize-none text-sm
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