import React, { useEffect, useState } from "react";
import { api } from "../services/api";

const ValidationPanel = () => {
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initial state - no release validated yet
    setValidationResult(null);
    setError(null);
  }, []);

  const validateRelease = async (releaseData) => {
    setIsValidating(true);
    setError(null);

    try {
      const response = await api.validateRelease(releaseData);
      setValidationResult(response.validation);
    } catch (error) {
      setError("Unable to connect to the backend.");
      setValidationResult({
        isValid: false,
        missingFields: ["api"],
        completedFields: [],
        totalRequired: 7,
        completedCount: 0,
      });
    }

    setIsValidating(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-medium text-gray-900 mb-4">
        Release Readiness
      </h2>

      {error && (
        <div className="bg-red-100 border-red-400 text-red-700 px-4 py-3 rounded-md mb-4">
          <p className="font-medium">{error}</p>
        </div>
      )}

      {validationResult ? (
        <div>
          <p className="text-sm text-gray-500 mb-2">Required sections</p>

          <div className="space-y-2">
            {["completedFeatures", "bugFixes", "changedBehaviour", "qaSummary", "knownLimitations", "migrationNotes", "affectedUserGroups"].map((field) => {
              const hasValue = validationResult.completedFields.includes(field);
              return (
                <div key={field} className="flex items-center">
                  <span
                    className={
                      hasValue
                        ? "w-4 h-4 rounded-full bg-green-500 flex-shrink-0"
                        : "w-4 h-4 rounded-stroke bg-current flex-shrink-0"
                    }
                  />
                  <span className="ml-3 text-sm text-gray-600 capitalize">
                    {field.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4">
            <p className="text-lg font-medium">
              {`${validationResult.completedCount} / ${validationResult.totalRequired} sections complete`}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {validationResult.isValid
                ? "Release package is ready for analysis."
                : "Additional information is required."}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          No release package validated yet.
        </p>
      )}
    </div>
  );
};

export default ValidationPanel;