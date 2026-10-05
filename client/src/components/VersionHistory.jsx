import React, { useEffect, useState } from "react";
import { api } from "../services/api";

const normalizeVersion = (version) =>
  String(version || "").trim().replace(/^v/i, "");

const getUniqueVersions = (releases, activeReleaseId) => {
  const versionsByLabel = new Map();

  releases.forEach((release) => {
    const key = normalizeVersion(release.version);
    const existing = versionsByLabel.get(key);
    const releaseIsActive = release.releaseId === activeReleaseId;
    const existingIsActive = existing?.releaseId === activeReleaseId;
    const releaseIsApproved = release.status === "approved";
    const existingIsApproved = existing?.status === "approved";
    const releaseIsNewer =
      new Date(release.updatedAt || release.createdAt || 0).getTime() >
      new Date(existing?.updatedAt || existing?.createdAt || 0).getTime();

    if (
      !existing ||
      (releaseIsActive && !existingIsActive) ||
      (releaseIsActive === existingIsActive &&
        releaseIsApproved &&
        !existingIsApproved) ||
      (releaseIsActive === existingIsActive &&
        releaseIsApproved === existingIsApproved &&
        releaseIsNewer)
    ) {
      versionsByLabel.set(key, release);
    }
  });

  return [...versionsByLabel.values()].slice(0, 5);
};

const VersionHistory = ({ releaseId, activeReleaseId, refreshKey }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [oldReleaseId, setOldReleaseId] = useState("");
  const [newReleaseId, setNewReleaseId] = useState("");
  const [comparison, setComparison] = useState(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonError, setComparisonError] = useState("");
  const [historyError, setHistoryError] = useState("");

  useEffect(() => {
    let isCurrentRequest = true;

    const loadVersions = async () => {
      if (!releaseId) {
        setVersions([]);
        setLoading(false);
        setOldReleaseId("");
        setNewReleaseId("");
        setComparison(null);
        setHistoryError("");
        return;
      }

      setLoading(true);
      setHistoryError("");
      try {
        const result = await api.getVersions(releaseId);
        if (!isCurrentRequest) return;
        const loadedVersions = getUniqueVersions(
          Array.isArray(result?.versions) ? result.versions : [],
          activeReleaseId
        );
        setVersions(loadedVersions);
        const activeIndex = loadedVersions.findIndex(
          (version) => version.releaseId === activeReleaseId
        );
        const currentIndex = activeIndex >= 0 ? activeIndex : 0;
        setNewReleaseId(loadedVersions[currentIndex]?.releaseId || "");
        setOldReleaseId(
          loadedVersions[currentIndex + 1]?.releaseId ||
            loadedVersions.find((version, index) => index !== currentIndex)
              ?.releaseId ||
            ""
        );
        setComparison(null);
        setComparisonError("");
      } catch (error) {
        console.error("Failed to load versions:", error);
        if (isCurrentRequest) {
          setVersions([]);
          setHistoryError("Unable to load version history. Please try again.");
        }
      } finally {
        if (isCurrentRequest) setLoading(false);
      }
    };

    loadVersions();
    return () => {
      isCurrentRequest = false;
    };
  }, [releaseId, activeReleaseId, refreshKey]);

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

  return (
    <section
      aria-live="polite"
      className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <h3 className="mb-4 text-xl font-semibold text-gray-900">Version History</h3>
      {loading ? (
        <p className="text-sm text-gray-500">Loading version history...</p>
      ) : (
        <>
          {historyError && (
            <p role="alert" className="mb-4 text-sm text-red-700">
              {historyError}
            </p>
          )}
          {versions.length === 0 ? (
            <p className="text-sm text-gray-500">No version history found.</p>
          ) : (
            <>
              <div className="space-y-2">
                {versions.map((v) => (
                  <div
                    key={v.releaseId}
                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3"
                  >
                    <span className="font-medium text-gray-900">
                      {v.version}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
                        v.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : v.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {v.status}
                    </span>
                  </div>
                ))}
              </div>

              <section className="mt-6 border-t border-gray-200 pt-5">
                <h4 className="mb-4 text-lg font-semibold text-gray-900">
                  Version Comparison
                </h4>
                {versions.length < 2 ? (
                  <p className="text-sm text-gray-500">
                    Create another version to compare release changes.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Compare
                        <select
                          value={oldReleaseId}
                          onChange={(event) => {
                            setOldReleaseId(event.target.value);
                            setComparison(null);
                          }}
                          className="mt-1 block min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-normal shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        >
                          {versions.map((version) => (
                            <option key={version.releaseId} value={version.releaseId}>
                              {version.version}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block text-sm font-semibold text-gray-700">
                        With
                        <select
                          value={newReleaseId}
                          onChange={(event) => {
                            setNewReleaseId(event.target.value);
                            setComparison(null);
                          }}
                          className="mt-1 block min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-normal shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
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
                      className="min-h-11 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                  <h4 className="mb-4 text-lg font-semibold text-gray-900">
                    {comparison.oldVersion} → {comparison.newVersion}
                  </h4>
                  <div className="space-y-3">
                    {comparison.sections.map((section) => (
                      <article
                        key={section.field}
                        className={`rounded-md border p-4 ${
                          section.changed
                            ? "border-amber-300 bg-amber-50"
                            : "border-green-200 bg-green-50/70"
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
                            <p className="mt-3 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-900">
                              ⚠ Changed
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
        </>
      )}
    </section>
  );
};

export default VersionHistory;