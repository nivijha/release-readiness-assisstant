import React from "react";

const UnsupportedClaimsPanel = ({ analysis }) => {
  const unsupportedClaims = Array.isArray(analysis?.unsupportedClaims)
    ? analysis.unsupportedClaims
    : [];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-medium text-gray-900 mb-4">
        <span className="text-sm font-medium text-red-600">
          Unsupported / Insufficiently Supported Claims
        </span>
      </h2>

      {unsupportedClaims.length === 0 ? (
        <p className="text-green-600">✓ No unsupported claims detected.</p>
      ) : (
        <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
          {unsupportedClaims.map((entry, idx) => {
            const item =
              entry !== null && typeof entry === "object" ? entry : {};
            const claim =
              typeof entry === "string" ? entry : item.claim || "";
            const reason = typeof item.reason === "string" ? item.reason : "";
            const qaEvidence =
              typeof item.qaEvidence === "string" ? item.qaEvidence : "";

            return (
              <li key={idx} className="border-l-4 border-red-500 pl-3">
                <strong className="text-red-600">{claim}</strong>
                {reason && (
                  <div className="text-xs text-gray-400 mt-1">
                    <strong>Reason:</strong> {reason}
                  </div>
                )}
                {qaEvidence && (
                  <div className="text-xs text-gray-400 mt-1">
                    <strong>QA Evidence:</strong> {qaEvidence}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default UnsupportedClaimsPanel;