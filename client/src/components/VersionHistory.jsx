import React, { useEffect, useState } from "react";
import { api } from "../services/api";

const VersionHistory = ({ releaseId }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [oldReleaseId, setOldReleaseId] = useState("");
  const [newReleaseId, setNewReleaseId] = useState("");
  const [comparison, setComparison] = useState(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonError, setComparisonError] = useState("");
  const [historyError, setHistoryError] = useState("");

  useEffect(() => {
    const loadVersions = async () => {
      if (!releaseId) {
        setVersions([]);
        setLoading(false);
        setOldReleaseId("");
        setNewReleaseId("");
        setComparison(null);
        return;
      }

      setLoading(true);
      try {
        const result = await api.getVersions(releaseId);
        const loadedVersions = result.versions || [];
        setVersions(loadedVersions);
        setOldReleaseId(loadedVersions[1]?.releaseId || "");
        setNewReleaseId(loadedVersions[0]?.releaseId || "");
        setComparison(null);
        setComparisonError("");
        setHistoryError("");
      } catch (error) {
        console.error("Failed to load versions:", error);
        setVersions([]);
        setHistoryError("Unable to load version history. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    loadVersions();
  }, [releaseId]);

  const handleCompare = async () => {
    if (!oldReleaseId || !newReleaseId || comparisonLoading) return;

    setComparisonLoading(true);
    setComparisonError("");
    try {
      const result = await api.compareVersions(oldReleaseId, newReleaseId);
      setComparison(result.comparison);
    } catch (error) {
      console.error("Failed to compare versions:", error);
      setComparison(null);
      setComparisonError(
        error.response?.data?.message || "Unable to compare these versions."
      );
    } finally {
      setComparisonLoading(false);
    }
  };

  const sectionLabels = {
    completedFeatures: "Completed Features",
    bugFixes: "Bug Fixes",
    changedBehaviour: "Changed Behaviour",
    qaSummary: "QA Summary",
    knownLimitations: "Known Limitations",
    migrationNotes: "Migration Notes",
    affectedUserGroups: "Affected User Groups",
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Loading version history...</p>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-6">
      <h3 className="text-xl font-medium text-gray-900 mb-4">Version History</h3>
      {historyError && (
        <p role="alert" className="mb-4 text-sm text-red-700">
          {historyError}
        </p>
      )}
      {versions.length === 0 ? (
        <p className="text-sm text-gray-500">No version history found.</p>
      ) : (
        <>
          <div className="space-y-2 text-sm">
            {versions.map((v) => (
              <div
                key={v.releaseId}
                className="flex items-center justify-between p-2 rounded-md border border-gray-200"
              >
                <span className="text-gray-700">
                  {v.version} {v.status.toUpperCase()}
                </span>
                {v.previousReleaseId && (
                  <span className="text-xs text-gray-500">
                    ← {v.previousReleaseId.slice(-6)}
                  </span>
                )}
              </div>
            ))}
          </div>

          <section className="mt-6 border-t border-gray-200 pt-5">
            <h4 className="text-lg font-medium text-gray-900 mb-4">
              Version Comparison
            </h4>
            {versions.length < 2 ? (
              <p className="text-sm text-gray-500">
                Create another version to compare release changes.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Compare
                    <select
                      value={oldReleaseId}
                      onChange={(event) => {
                        setOldReleaseId(event.target.value);
                        setComparison(null);
                      }}
                      className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {versions.map((version) => (
                        <option key={version.releaseId} value={version.releaseId}>
                          {version.version}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-gray-700">
                    With
                    <select
                      value={newReleaseId}
                      onChange={(event) => {
                        setNewReleaseId(event.target.value);
                        setComparison(null);
                      }}
                      className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {versions.map((version) => (
                        <option key={version.releaseId} value={version.releaseId}>
                          {version.version}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <button
                  type="button"
                  onClick={handleCompare}
                  disabled={
                    !oldReleaseId ||
                    !newReleaseId ||
                    oldReleaseId === newReleaseId ||
                    comparisonLoading
                  }
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {comparisonLoading ? "Comparing..." : "Compare Versions"}
                </button>
                {comparisonError && (
                  <p role="alert" className="text-sm text-red-700">
                    {comparisonError}
                  </p>
                )}
              </div>
            )}
          </section>

          {comparison && (
            <section className="mt-6 border-t border-gray-200 pt-5">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                {comparison.oldVersion} → {comparison.newVersion}
              </h4>
              <div className="space-y-3">
                {comparison.sections.map((section) => (
                  <article
                    key={section.field}
                    className={`rounded-md border p-4 ${
                      section.changed
                        ? "border-red-300 bg-red-50"
                        : "border-green-200 bg-green-50"
                    }`}
                  >
                    <h5 className="font-medium text-gray-900">
                      {sectionLabels[section.field] || section.field}
                    </h5>
                    {section.changed ? (
                      <>
                        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                          Old
                        </p>
                        <p className="whitespace-pre-wrap break-words text-sm text-gray-800">
                          {section.oldValue || "—"}
                        </p>
                        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
                          New
                        </p>
                        <p className="whitespace-pre-wrap break-words text-sm text-gray-800">
                          {section.newValue || "—"}
                        </p>
                        <p className="mt-3 text-sm font-semibold text-red-700">
                          CHANGED
                        </p>
                      </>
                    ) : (
                      <p className="mt-2 text-sm font-semibold text-green-800">
                        ✓ UNCHANGED
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default VersionHistory;