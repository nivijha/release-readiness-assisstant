import React from "react";
import ImpactPanel from "./ImpactPanel";
import UnsupportedClaimsPanel from "./UnsupportedClaimsPanel";
import BriefPanel from "./BriefPanel";

const AnalysisListPanel = ({
  title,
  items,
  primaryField,
  detailFields,
  emptyMessage,
}) => (
  <section className="rounded-lg border border-gray-200 p-4">
    <h3 className="font-medium text-gray-900 mb-3">{title}</h3>
    {items.length === 0 ? (
      <p className="text-sm text-gray-500">{emptyMessage}</p>
    ) : (
      <ul className="space-y-3">
        {items.map((entry, index) => {
          const item =
            entry !== null && typeof entry === "object" ? entry : {};
          const primary =
            typeof entry === "string" ? entry : item[primaryField] || "";

          return (
            <li key={`${title}-${index}`} className="text-sm text-gray-700">
              {primary && <p className="font-medium">{primary}</p>}
              {detailFields.map(({ field, label }) => {
                const value = item[field];
                const detail = Array.isArray(value)
                  ? value.filter((part) => typeof part === "string").join(", ")
                  : typeof value === "string"
                    ? value
                    : "";

                return detail ? (
                  <p key={field} className="mt-1 text-gray-500">
                    <span className="font-medium">{label}:</span> {detail}
                  </p>
                ) : null;
              })}
            </li>
          );
        })}
      </ul>
    )}
  </section>
);

const ValidationPanel = ({
  validationResult,
  analysis,
  isAnalyzing,
  analysisError,
  validationError,
}) => {
  const completedFields = Array.isArray(validationResult?.completedFields)
    ? validationResult.completedFields
    : [];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-medium text-gray-900 mb-4">
        Release Readiness
      </h2>

      {validationError && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {validationError}
        </div>
      )}

      {analysisError && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {analysisError}
        </div>
      )}

      {isAnalyzing ? (
        <p className="text-sm text-gray-600" aria-live="polite">
          Analyzing Release...
        </p>
      ) : analysis ? (
        <div>
          <p className="mb-4 text-sm font-medium text-green-700" role="status">
            Analysis completed successfully.
          </p>
          <div className="space-y-4">
            <ImpactPanel analysis={analysis} />
            <AnalysisListPanel
              title="Missing Information"
              items={analysis.missingInformation}
              primaryField="item"
              detailFields={[{ field: "reason", label: "Reason" }]}
              emptyMessage="No missing information identified."
            />
            <UnsupportedClaimsPanel analysis={analysis} />
            <AnalysisListPanel
              title="Risks"
              items={analysis.risks}
              primaryField="risk"
              detailFields={[
                { field: "severity", label: "Severity" },
                { field: "source", label: "Source" },
                { field: "reason", label: "Reason" },
              ]}
              emptyMessage="No risks identified."
            />
            <BriefPanel analysis={analysis} />
          </div>
        </div>
      ) : validationResult ? (
        <div>
          <p
            className={`text-sm font-medium ${
              validationResult.isValid ? "text-green-700" : "text-amber-700"
            }`}
          >
            {validationResult.isValid
              ? "Release package is structurally complete"
              : "Release package is missing required sections"}
          </p>

          <p className="mt-2 text-sm text-gray-500">Required sections</p>
          <div className="mt-2 space-y-2">
            {[
              "completedFeatures",
              "bugFixes",
              "changedBehaviour",
              "qaSummary",
              "knownLimitations",
              "migrationNotes",
              "affectedUserGroups",
            ].map((field) => {
              const hasValue = completedFields.includes(field);
              return (
                <div key={field} className="flex items-center">
                  <span
                    aria-hidden="true"
                    className={`h-3 w-3 flex-shrink-0 rounded-full ${
                      hasValue ? "bg-green-500" : "bg-gray-300"
                    }`}
                  />
                  <span className="ml-3 text-sm text-gray-600 capitalize">
                    {field.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                </div>
              );
            })}
          </div>
          {validationResult.isValid && (
            <p className="mt-4 text-sm text-gray-500">
              Create the release to enable AI-powered readiness analysis.
            </p>
          )}
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
