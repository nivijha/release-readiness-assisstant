import React from "react";

const UnsupportedClaimsPanel = ({ analysis }) => {
  const unsupportedClaims = analysis?.unsupportedClaims || [];

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
          {unsupportedClaims.map((item, idx) => (
            <li key={idx} className="border-l-4 border-red-500 pl-3">
              <strong className="text-red-600">{item.claim}</strong>
              <div className="text-xs text-gray-400 mt-1">
                <strong>Reason:</strong> {item.reason}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                <strong>QA Evidence:</strong> {item.qaEvidence}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UnsupportedClaimsPanel;