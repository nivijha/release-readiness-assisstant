import React, { useState } from "react";

const BriefPanel = ({ analysis }) => {
  const [internalEdited, setInternalEdited] = useState(false);
  const [stakeholderEdited, setStakeholderEdited] = useState(false);

  const internalSummary =
    analysis?.internalSummary?.text || "No internal summary available.";
  const stakeholderSummary =
    analysis?.stakeholderSummary?.text || "No stakeholder summary available.";
  const internalEvidence =
    analysis?.internalSummary?.evidence || [];
  const stakeholderEvidence =
    analysis?.stakeholderSummary?.evidence || [];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-medium text-gray-900 mb-4">
        Generated Brief
      </h2>

      <div className="space-y-4">
        {/* Internal Technical Brief */}
        <div>
          <h3 className="text-semibold text-gray-900 mb-2">
            Internal Technical Brief
          </h3>

          <textarea
            rows={4}
            className="
              w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none
              focus:ring-2 focus:ring-indigo-500 resize-none text-sm
              {internalEdited ? '' : 'bg-gray-50'}
            "
            value={internalSummary}
            onChange={(e) => {
              // In a full implementation, this would update state
              // For now just mark as edited
              setInternalEdited(true);
            }}
            disabled={!internalEdited}
            placeholder="Technical summary for developers, QA, and release managers..."
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
        </div>

        {/* Stakeholder / Client Brief */}
        <div>
          <h3 className="text-semibold text-gray-900 mb-2">
            Stakeholder / Client Brief
          </h3>

          <textarea
            rows={4}
            className="
              w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none
              focus:ring-2 focus:ring-indigo-500 resize-none text-sm
              {stakeholderEdited ? '' : 'bg-gray-50'}
            "
            value={stakeholderSummary}
            onChange={(e) => {
              setStakeholderEdited(true);
            }}
            disabled={!stakeholderEdited}
            placeholder="Client-friendly summary for stakeholders and non-technical users..."
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
        </div>
      </div>
    </div>
  );
};

export default BriefPanel;