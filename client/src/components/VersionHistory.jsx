import React, { useEffect, useState } from "react";
import { api } from "../services/api";

const VersionHistory = ({ releaseId }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVersions = async () => {
      setLoading(true);
      try {
        const result = await api.getVersions(releaseId);
        setVersions(result.versions || []);
      } catch (error) {
        console.error("Failed to load versions:", error);
      } finally {
        setLoading(false);
      }
    };
    loadVersions();
  }, [releaseId]);

  if (loading) {
    return <p className="text-sm text-gray-500">Loading version history...</p>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-6">
      <h3 className="text-xl font-medium text-gray-900 mb-4">Version History</h3>
      {versions.length === 0
        ? <p className="text-sm text-gray-500">No version history found.</p>
        : (
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
          )}
    </div>
  );
};

export default VersionHistory;