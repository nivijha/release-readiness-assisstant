import axios from "axios";

const apiInstance = axios.create({
  baseURL: "http://localhost:5000/api",
});

/**
 * Validates a release package by sending it to the backend.
 *
 * @param {Object} releaseData - The release package data
 * @returns {Promise<Object>} Axios response containing validation result
 */
export const validateRelease = async (releaseData) => {
  const response = await apiInstance.post("/releases/validate", releaseData);
  return response.data;
};

/**
 * Creates a new release in the database.
 *
 * @param {Object} releaseData - The release package data
 * @returns {Promise<Object>} Axios response containing created release
 */
export const createRelease = async (releaseData) => {
  const response = await apiInstance.post("/releases", releaseData);
  return response.data;
};

/**
 * Analyzes a release package using AI.
 *
 * @param {Object} releaseData - The release package data
 * @returns {Promise<Object>} Axios response containing AI analysis
 */
export const analyzeRelease = async (releaseData) => {
  const response = await apiInstance.post("/releases/analyze", releaseData);
  return response.data;
};

/** API service object exposing all release methods. */
export const api = {
  validateRelease,
  createRelease,
  analyzeRelease,
};