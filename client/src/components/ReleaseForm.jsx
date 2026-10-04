import React, { useState } from "react";
import { api } from "../services/api";

const ReleaseForm = ({ onValidate, onCreate }) => {
  const [formState, setFormState] = useState({
    version: "",
    title: "",
    releaseDate: "",
    completedFeatures: "",
    bugFixes: "",
    changedBehaviour: "",
    qaSummary: "",
    knownLimitations: "",
    migrationNotes: "",
    affectedUserGroups: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleValidate = async (e) => {
    e.preventDefault();

    setIsValidating(true);
    setValidationResult(null);

    try {
      const response = await api.validateRelease(formState);
      setValidationResult(response.validation);
    } catch (error) {
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

  const handleCreate = async (e) => {
    e.preventDefault();

    if (submitting) return;

    setSubmitting(true);

    try {
      const response = await api.createRelease(formState);
      setValidationResult(null);
      onCreate(response.release);
    } catch (error) {
      setValidationResult({
        isValid: false,
        missingField: ["api"],
        completedFields: [],
        totalRequired: 7,
        completedCount: 0,
      });
    }

    setSubmitting(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-8 max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Release Package</h2>

      <form>
        {/* Release Information Section */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-3">
            Release Information
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Version
              </label>
              <input
                type="text"
                name="version"
                value={formState.version}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., v2.4.0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={formState.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Data Import Improvements"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Release Date
            </label>
            <input
              type="date"
              name="releaseDate"
              value={formState.releaseDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Completed Features */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-500 mb-3">
            Completed Features
          </h3>
          <textarea
            name="completedFeatures"
            rows={3}
            value={formState.completedFeatures}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-text placeholder-gray-400"
            placeholder="Describe the features completed in this release..."
          ></textarea>
        </div>

        {/* Bug Fixes */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Bug Fixes</h3>
          <textarea
            name="bugFixes"
            rows={3}
            value={formState.bugFixes}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-text placeholder-gray-400"
            placeholder="Describe bugs fixed in this release..."
          ></textarea>
        </div>

        {/* Changed Behaviour */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-500 mb-3">
            Changed Behaviour
          </h3>
          <textarea
            name="changedBehaviour"
            rows={3}
            value={formState.changedBehaviour}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-text placeholder-gray-400"
            placeholder="Describe behaviour that has changed..."
          ></textarea>
        </div>

        {/* QA Summary */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-500 mb-3">QA Summary</h3>
          <textarea
            name="qaSummary"
            rows={3}
            value={formState.qaSummary}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-text placeholder-gray-400"
            placeholder="Describe testing performed, test results, regression testing, failures, etc."
          ></textarea>
        </div>

        {/* Known Limitations */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-500 mb-3">
            Known Limitations
          </h3>
          <textarea
            name="knownLimitations"
            rows={3}
            value={formState.knownLimitations}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-text placeholder-gray-400"
            placeholder="List known limitations or unresolved issues..."
          ></textarea>
        </div>

        {/* Migration / Configuration Notes */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-500 mb-3">
            Migration / Configuration Notes
          </h3>
          <textarea
            name="migrationNotes"
            rows={3}
            value={formState.migrationNotes}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-text placeholder-gray-400"
            placeholder="Describe required configuration or migration steps..."
          ></textarea>
        </div>

        {/* Affected User Groups */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-3">
            Affected User Groups
          </h3>
          <textarea
            name="affectedUserGroups"
            rows={3}
            value={formState.affectedUserGroups}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-text placeholder-gray-400"
            placeholder="Describe which users/customers are affected..."
          ></textarea>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <button
            type="button"
            onClick={handleValidate}
            disabled={isValidating}
            className="
              px-6 py-2.5 bg-blue-600 text-white font-medium rounded-md
              hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {isValidating ? "Validating..." : "Validate Release"}
          </button>

          <button
            type="button"
            onClick={handleCreate}
            disabled={isValidating || !validationResult?.isValid}
            className="
              px-6 py-2.5 bg-green-600 text-white font-medium rounded-md
              hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            Create Release
          </button>
        </div>
      </form>

      {/* Validation Result Display */}
      {/* Validation Result Display */}
      {validationResult && (
        <div
          className={`mt-6 p-4 rounded-md ${
            validationResult.isValid
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          <p className="font-medium">
            {validationResult.isValid
              ? "Release package is structurally complete"
              : "Release package is missing required sections"}
          </p>

          {!validationResult.isValid && (
            <p className="mt-1 text-sm">
              Missing {validationResult.missingFields.length} of{" "}
              {validationResult.totalRequired} sections
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ReleaseForm;
