import React from "react";

const UnsupportedClaimsPanel = ({ analysis }) => {
  const unsupportedClaims = Array.isArray(analysis?.unsupportedClaims)
    ? analysis.unsupportedClaims
    : [];

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <h2 className="mb-4 text-base font-semibold text-gray-900">
        <span>
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
              <li key={idx} className="rounded-r-md border-l-4 border-red-400 bg-white py-2 pl-3 pr-2">
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