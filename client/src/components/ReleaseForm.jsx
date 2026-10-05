import React, { useEffect, useState } from "react";

const ReleaseForm = ({
  validationResult,
  createdRelease,
  validationError,
  createError,
  isValidating,
  isCreating,
  isSavingPackage,
  isAnalyzing,
  onValidate,
  onCreate,
  onSavePackage,
  onPackageChange,
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
  const canEdit =
    !createdRelease || createdRelease.status === "draft";
  const isDraft = createdRelease?.status === "draft";

  useEffect(() => {
    if (!createdRelease) {
      setFormState({
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
      return;
    }

    const packageData = createdRelease.package || {};
    const asText = (value) =>
      Array.isArray(value) ? value.join("\n") : typeof value === "string" ? value : "";
    setFormState({
      version: createdRelease.version || "",
      title: createdRelease.title || "",
      releaseDate: createdRelease.releaseDate || "",
      completedFeatures: asText(packageData.completedFeatures),
      bugFixes: asText(packageData.bugFixes),
      changedBehaviour: asText(packageData.changedBehaviour),
      qaSummary: asText(packageData.qaSummary),
      knownLimitations: asText(packageData.knownLimitations),
      migrationNotes: asText(packageData.migrationNotes),
      affectedUserGroups: asText(packageData.affectedUserGroups),
    });
  }, [createdRelease]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
    onPackageChange?.();
  };

  const handleValidate = (e) => {
    e.preventDefault();
    onValidate(formState);
  };

  const handleCreate = (e) => {
    e.preventDefault();
    onCreate(formState);
  };

  const handleSavePackage = () => {
    onSavePackage?.(formState);
  };

  return (
    <div className="max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-gray-900">Release Package</h2>
        {createdRelease && (
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
              isDraft
                ? "bg-blue-100 text-blue-800"
                : createdRelease.status === "approved"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
            }`}
          >
            {createdRelease.status}
          </span>
        )}
      </div>
      {isDraft && (
        <p className="mb-5 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-800">
          Draft package — editable until approval.
        </p>
      )}

      <form>
        {/* Release Information Section */}
        <div className="mb-7">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">
            Release Information
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                Version
              </label>
              <input
                type="text"
                name="version"
                value={formState.version}
                onChange={handleChange}
                disabled={Boolean(createdRelease) || isCreating}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="e.g., v2.4.0"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={formState.title}
                onChange={handleChange}
                disabled={!canEdit || isCreating}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="e.g., Data Import Improvements"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Release Date
            </label>
            <input
              type="date"
              name="releaseDate"
              value={formState.releaseDate}
              onChange={handleChange}
              disabled={!canEdit || isCreating}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
        </div>

        {/* Completed Features */}
        <div className="mb-6">
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            Completed Features
          </h3>
          <textarea
            name="completedFeatures"
            rows={4}
            value={formState.completedFeatures}
            onChange={handleChange}
            disabled={!canEdit || isCreating}
            className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm leading-6 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="Describe the features completed in this release..."
          ></textarea>
        </div>

        {/* Bug Fixes */}
        <div className="mb-6">
          <h3 className="mb-2 text-sm font-semibold text-gray-700">Bug Fixes</h3>
          <textarea
            name="bugFixes"
            rows={4}
            value={formState.bugFixes}
            onChange={handleChange}
            disabled={!canEdit || isCreating}
            className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm leading-6 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="Describe bugs fixed in this release..."
          ></textarea>
        </div>

        {/* Changed Behaviour */}
        <div className="mb-6">
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            Changed Behaviour
          </h3>
          <textarea
            name="changedBehaviour"
            rows={4}
            value={formState.changedBehaviour}
            onChange={handleChange}
            disabled={!canEdit || isCreating}
            className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm leading-6 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="Describe behaviour that has changed..."
          ></textarea>
        </div>

        {/* QA Summary */}
        <div className="mb-6">
          <h3 className="mb-2 text-sm font-semibold text-gray-700">QA Summary</h3>
          <textarea
            name="qaSummary"
            rows={4}
            value={formState.qaSummary}
            onChange={handleChange}
            disabled={!canEdit || isCreating}
            className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm leading-6 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="Describe testing performed, test results, regression testing, failures, etc."
          ></textarea>
        </div>

        {/* Known Limitations */}
        <div className="mb-6">
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            Known Limitations
          </h3>
          <textarea
            name="knownLimitations"
            rows={4}
            value={formState.knownLimitations}
            onChange={handleChange}
            disabled={!canEdit || isCreating}
            className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm leading-6 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="List known limitations or unresolved issues..."
          ></textarea>
        </div>

        {/* Migration / Configuration Notes */}
        <div className="mb-6">
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            Migration / Configuration Notes
          </h3>
          <textarea
            name="migrationNotes"
            rows={4}
            value={formState.migrationNotes}
            onChange={handleChange}
            disabled={!canEdit || isCreating}
            className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm leading-6 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="Describe required configuration or migration steps..."
          ></textarea>
        </div>

        {/* Affected User Groups */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            Affected User Groups
          </h3>
          <textarea
            name="affectedUserGroups"
            rows={4}
            value={formState.affectedUserGroups}
            onChange={handleChange}
            disabled={!canEdit || isCreating}
            className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm leading-6 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="Describe which users/customers are affected..."
          ></textarea>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleValidate}
            disabled={isValidating || isCreating || !canEdit}
            className="
              rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white transition-colors
              hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
              disabled:cursor-not-allowed disabled:opacity-50
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
              rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white transition-colors
              hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
              disabled:cursor-not-allowed disabled:opacity-50
            "
          >
            {isCreating ? "Creating..." : "Create Release"}
          </button>
        </div>
      </form>

      {validationError && (
        <div role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {validationError}
        </div>
      )}

      {validationResult && (
        <div
          className={`mt-6 rounded-lg border p-4 text-sm ${
            validationResult.isValid
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-amber-200 bg-amber-50 text-amber-900"
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
        <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="font-semibold text-gray-900">
            Release {createdRelease.version || ""} is active
          </p>
          <p className="mt-1 text-sm text-gray-600">
            {isDraft
              ? "Draft package can be edited and saved before analysis."
              : "This release is read-only."}
          </p>
          {isDraft && (
            <button
              type="button"
              onClick={handleSavePackage}
              disabled={isSavingPackage || isCreating}
              className="mt-4 mr-3 rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSavingPackage ? "Saving..." : "Save Package"}
            </button>
          )}
          <button
            type="button"
            onClick={() => onAnalyze(formState)}
            disabled={
              !isDraft ||
              !validationResult?.isValid ||
              !createdRelease.releaseId ||
              isAnalyzing
            }
            className="
              mt-4 rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white transition-colors
              hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
              disabled:cursor-not-allowed disabled:opacity-50
            "
          >
            {isAnalyzing ? "Analyzing Release..." : "Analyze Release"}
          </button>
        </div>
      )}

      {createError && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">
            ❌ Failed to create release
          </p>
          <p className="text-sm mt-1">{createError}</p>
        </div>
      )}
    </div>
  );
};

export default ReleaseForm;
