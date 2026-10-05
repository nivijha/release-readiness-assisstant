import axios from "axios";

const apiInstance = axios.create({
  baseURL: "http://localhost:5000/api",
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

/** API service object exposing all release methods. */
export const api = {
  validateRelease,
  createRelease,
  analyzeRelease,
  saveReview,
  approveRelease,
  rejectRelease,
};