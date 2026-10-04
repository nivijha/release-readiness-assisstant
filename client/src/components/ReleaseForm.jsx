import React, { useState } from "react";

const ReleaseForm = ({
  validationResult,
  createdRelease,
  validationError,
  createError,
  isValidating,
  isCreating,
  isAnalyzing,
  onValidate,
  onCreate,
  onAnalyze,
}) => {
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleValidate = (e) => {
    e.preventDefault();
    onValidate(formState);
  };

  const handleCreate = (e) => {
    e.preventDefault();
    onCreate(formState);
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
                disabled={Boolean(createdRelease) || isCreating}
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
                disabled={Boolean(createdRelease) || isCreating}
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
              disabled={Boolean(createdRelease) || isCreating}
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
            disabled={Boolean(createdRelease) || isCreating}
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
            disabled={Boolean(createdRelease) || isCreating}
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
            disabled={Boolean(createdRelease) || isCreating}
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
            disabled={Boolean(createdRelease) || isCreating}
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
            disabled={Boolean(createdRelease) || isCreating}
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
            disabled={Boolean(createdRelease) || isCreating}
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
            disabled={Boolean(createdRelease) || isCreating}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-text placeholder-gray-400"
            placeholder="Describe which users/customers are affected..."
          ></textarea>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <button
            type="button"
            onClick={handleValidate}
            disabled={isValidating || isCreating || Boolean(createdRelease)}
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
            disabled={
              isValidating ||
              isCreating ||
              !validationResult?.isValid ||
              Boolean(createdRelease)
            }
            className="
              px-6 py-2.5 bg-green-600 text-white font-medium rounded-md
              hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {isCreating ? "Creating..." : "Create Release"}
          </button>
        </div>
      </form>

      {validationError && (
        <div role="alert" className="mt-6 p-4 rounded-md bg-red-100 text-red-800">
          {validationError}
        </div>
      )}

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
              Missing {(Array.isArray(validationResult.missingFields)
                ? validationResult.missingFields
                : []).length} of{" "}
              {validationResult.totalRequired} sections
            </p>
          )}
        </div>
      )}

      {createdRelease && (
        <div className="mt-6 p-4 rounded-bg bg-green-100 border-green-400">
          <p className="font-medium">
            ✅ Release created successfully
          </p>
          <p className="text-sm mt-1">
            Version: {createdRelease.version || ""}
            <br />
            Release ID: {createdRelease.releaseId || ""}
            <br />
            Status: {createdRelease.status || ""}
          </p>
          <p className="text-xs mt-2 text-green-600">
            The release is saved. Analyze it to generate AI-powered insights.
          </p>
          <button
            type="button"
            onClick={() => onAnalyze(formState)}
            disabled={
              !validationResult?.isValid ||
              !createdRelease.releaseId ||
              isAnalyzing
            }
            className="
              mt-4 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-md
              hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {isAnalyzing ? "Analyzing Release..." : "Analyze Release"}
          </button>
        </div>
      )}

      {createError && (
        <div className="mt-6 p-4 rounded-bg bg-red-100 border-red-400">
          <p className="font-medium">
            ❌ Failed to create release
          </p>
          <p className="text-sm mt-1">{createError}</p>
        </div>
      )}
    </div>
  );
};

export default ReleaseForm;
