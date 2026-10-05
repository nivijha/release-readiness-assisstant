import React, { useEffect, useState } from "react";
import { api } from "../services/api";

const sectionLabels = {
  completedFeatures: "Completed Features",
  bugFixes: "Bug Fixes",
  changedBehaviour: "Changed Behaviour",
  qaSummary: "QA Summary",
  knownLimitations: "Known Limitations",
  migrationNotes: "Migration Notes",
  affectedUserGroups: "Affected User Groups",
};

const StaleStatementDetection = ({ releaseId }) => {
  const [staleStatements, setStaleStatements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadStaleStatements = async () => {
      if (!releaseId) {
        setStaleStatements([]);
        setError("");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const result = await api.getStaleStatements(releaseId);
        if (active) {
          setStaleStatements(result.staleStatements || []);
        }
      } catch (requestError) {
        console.error("Failed to detect stale statements:", requestError);
        if (active) {
          setStaleStatements([]);
          setError(
            requestError.response?.data?.message ||
              "Unable to check for stale statements."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadStaleStatements();
    return () => {
      active = false;
    };
  }, [releaseId]);

  return (
    <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <h3 className="mb-4 text-xl font-semibold text-gray-900">
        Stale Statement Detection
      </h3>
      {loading ? (
        <p className="text-sm text-gray-500">Checking release statements...</p>
      ) : error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : staleStatements.length === 0 ? (
        <p className="text-sm font-medium text-green-800">
          ✓ No stale statements detected.
        </p>
      ) : (
        <div className="space-y-4">
          <p className="font-semibold text-amber-800">
            ⚠️ Stale Statements Detected
          </p>
          {staleStatements.map((statement, index) => (
            <article
              key={`${statement.section}-${index}`}
              className="rounded-md border border-amber-300 bg-amber-50 p-4"
            >
              <h4 className="font-medium text-gray-900">
                Section: {sectionLabels[statement.section] || statement.section}
              </h4>
              <p className="mt-3 text-sm font-medium text-gray-700">
                Previous {statement.previousVersion}:
              </p>
              <p className="whitespace-pre-wrap break-words text-sm text-gray-800">
                {statement.previousStatement || "—"}
              </p>
              <p className="mt-3 text-sm font-medium text-gray-700">
                Current {statement.currentVersion}:
              </p>
              <p className="whitespace-pre-wrap break-words text-sm text-gray-800">
                {statement.currentStatement || "—"}
              </p>
              <p className="mt-3 text-sm text-gray-700">
                <span className="font-medium">Reason:</span> {statement.reason}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default StaleStatementDetection;
