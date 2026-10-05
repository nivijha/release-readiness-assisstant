import axios from "axios";

const apiInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
});

/**
 * Validates a release package by sending it to the backend.
 *
 * @param {Object} releaseData - The release package data
 * @returns {Promise<Object>} API response body containing validation result
 */
export const validateRelease = async (releaseData) => {
  const response = await apiInstance.post("/releases/validate", releaseData);
  return response.data;
};

/**
 * Creates a new release in the database.
 *
 * @param {Object} releaseData - The release package data
 * @returns {Promise<Object>} API response body containing the created release
 */
export const createRelease = async (releaseData) => {
  const response = await apiInstance.post("/releases", releaseData);
  return response.data;
};

/**
 * Analyzes a release package using AI.
 *
 * @param {Object} releaseData - The release package data
 * @returns {Promise<Object>} API response body containing AI analysis
 */
export const analyzeRelease = async (releaseData) => {
  const response = await apiInstance.post("/releases/analyze", releaseData);
  return response.data;
};

/**
 * Saves user-reviewed summaries for a release.
 *
 * @param {string} releaseId - The release ID
 * @param {Object} reviewData - The reviewed summaries
 * @param {string} reviewData.internalSummary - Edited internal summary
 * @param {string} reviewData.stakeholderSummary - Edited stakeholder summary
 * @returns {Promise<Object>} API response
 */
export const saveReview = async (releaseId, reviewData) => {
  const response = await apiInstance.put(`/releases/${releaseId}/review`, reviewData);
  return response.data;
};

/**
 * Approves a release.
 *
 * @param {string} releaseId - The release ID
 * @returns {Promise<Object>} API response
 */
export const approveRelease = async (releaseId) => {
  const response = await apiInstance.post(`/releases/${releaseId}/approve`, {});
  return response.data;
};

/**
 * Rejects a release with an optional reason.
 *
 * @param {string} releaseId - The release ID
 * @param {string} [reason] - The rejection reason
 * @returns {Promise<Object>} API response
 */
export const rejectRelease = async (releaseId, reason) => {
  const response = await apiInstance.post(`/releases/${releaseId}/reject`, { reason });
  return response.data;
};

/**
 * Creates a new version from an existing release.
 * POST /api/releases/:releaseId/versions
 *
 * @param {string} releaseId - The source release ID
 * @param {Object} versionData - { version: string }
 * @returns {Promise<Object>} API response with new release
 */
export const createNewVersion = async (releaseId, versionData) => {
  const response = await apiInstance.post(`/releases/${releaseId}/versions`, versionData);
  return response.data;
};

/**
 * Gets all versions belonging to the same release series.
 * GET /api/releases/:releaseId/versions
 *
 * @param {string} releaseId - The source release ID
 * @returns {Promise<Object>} API response with version history
 */
export const getVersions = async (releaseId) => {
  const response = await apiInstance.get(`/releases/${releaseId}/versions`);
  return response.data;
};

/**
 * Detects package sections that may contain stale statements.
 * GET /api/releases/:releaseId/stale-statements
 *
 * @param {string} releaseId - The current release ID
 * @returns {Promise<Object>} API response with stale statement candidates
 */
export const getStaleStatements = async (releaseId) => {
  const response = await apiInstance.get(
    `/releases/${encodeURIComponent(releaseId)}/stale-statements`
  );
  return response.data;
};

/**
 * Compares two releases from the same version series.
 * GET /api/releases/compare/:releaseId1/:releaseId2
 *
 * @param {string} releaseId1 - The first release ID
 * @param {string} releaseId2 - The second release ID
 * @returns {Promise<Object>} API response with comparison result
 */
export const compareVersions = async (releaseId1, releaseId2) => {
  const response = await apiInstance.get(
    `/releases/compare/${encodeURIComponent(releaseId1)}/${encodeURIComponent(releaseId2)}`
  );
  return response.data;
};

export const compareReleases = compareVersions;

/** API service object exposing all release methods. */
export const api = {
  validateRelease,
  createRelease,
  analyzeRelease,
  saveReview,
  approveRelease,
  rejectRelease,
  createNewVersion,
  getVersions,
  getStaleStatements,
  compareVersions,
  compareReleases,
};