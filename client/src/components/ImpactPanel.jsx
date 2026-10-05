import React from "react";

const ImpactPanel = ({ analysis }) => {
  const impactItems = Array.isArray(analysis?.impactAnalysis)
    ? analysis.impactAnalysis
    : [];

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <h2 className="mb-4 text-base font-semibold text-gray-900">
        User Impact Analysis
      </h2>

      {impactItems.length === 0 ? (
        <p className="text-sm text-gray-500">
          No impact analysis available.
        </p>
      ) : (
        <div className="space-y-4">
          {impactItems.map((entry, index) => {
            const item =
              entry !== null && typeof entry === "object" ? entry : {};
            const itemName =
              typeof entry === "string" ? entry : item.item || "";
            const impact =
              typeof item.impact === "string" ? item.impact : "";
            const reason =
              typeof item.reason === "string" ? item.reason : "";
            const evidence = Array.isArray(item.evidence)
              ? item.evidence.filter((value) => typeof value === "string").join(", ")
              : typeof item.evidence === "string"
                ? item.evidence
                : "";
            const impactClass =
              impact === "High"
                ? "bg-red-100 text-red-800"
                : impact === "Medium"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-green-100 text-green-800";

            return (
              <div key={index} className="flex items-start rounded-lg border border-gray-200 bg-white p-3">
                <span
                  className={`mt-1 h-3 w-3 flex-shrink-0 rounded-full ${impactClass}`}
                />
                <div className="ml-3 min-w-0 flex-1">
                  <p className="font-medium text-gray-900">
                    {itemName}
                  </p>
                  <p className="text-sm text-gray-500">
                    Impact: {impact}
                  </p>
                  {reason && <p className="text-xs text-gray-400">{reason}</p>}
                  {evidence && (
                    <p className="text-xs text-gray-400">
                      Evidence: {evidence}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ImpactPanel;