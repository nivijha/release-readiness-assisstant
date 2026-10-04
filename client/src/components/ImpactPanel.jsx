import React from "react";

const ImpactPanel = ({ analysis }) => {
  const impactItems = analysis?.impactAnalysis || [];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-medium text-gray-900 mb-4">
        User Impact Analysis
      </h2>

      {impactItems.length === 0 ? (
        <p className="text-sm text-gray-500">
          No impact analysis available.
        </p>
      ) : (
        <div className="space-y-4">
          {impactItems.map((item, index) => {
            const impactClass =
              item.impact === "High"
                ? "bg-red-100 text-red-800"
                : item.impact === "Medium"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-green-100 text-green-800";

            return (
              <div key={index} className="flex items-start">
                <span
                  className={`w-3 h-3 rounded-full ${impactClass} flex-shrink-0 mt-1`}
                />
                <div className="ml-3 flex-1">
                  <p className="font-medium text-gray-900">
                    {item.item}
                  </p>
                  <p className="text-sm text-gray-500">
                    Impact: {item.impact}
                  </p>
                  <p className="text-xs text-gray-400">
                    {item.reason}
                  </p>
                  <p className="text-xs text-gray-400">
                    Evidence: {item.evidence}
                  </p>
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