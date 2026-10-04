// Deterministic required-section validation for release packages

const REQUIRED_FIELDS = [
  "completedFeatures",
  "bugFixes",
  "changedBehaviour",
  "qaSummary",
  "knownLimitations",
  "migrationNotes",
  "affectedUserGroups"
];

/**
 * Validates a release package object.
 * Checks that all required fields are present and not empty/whitespace.
 *
 * @param {Object} releasePackage - The release package to validate
 * @param {string} releasePackage.completedFeatures -
 * @param {string} releasePackage.bugFixes -
 * @param {string} releasePackage.changedBehaviour -
 * @param {string} releasePackage.qaSummary -
 * @param {string} releasePackage.knownLimitations -
 * @param {string} releasePackage.migrationNotes -
 * @param {string} releasePackage.affectedUserGroups -
 *
 * @returns {Object} Validation result
 *   - isValid: boolean
 *   - missingFields: string[] - list of field names that are missing/empty
 *   - completedFields: string[] - list of field names that have values
 *   - totalRequired: number - total number of required fields (7)
 *   - completedCount: number - number of fields with values
 */
function validateReleasePackage(releasePackage) {
  const missingFields = [];
  const completedFields = [];

  REQUIRED_FIELDS.forEach((field) => {
    const value = releasePackage[field];

    // Treat null, undefined, empty string, or whitespace-only as missing
    const isMissing =
      value === null ||
      value === undefined ||
      value.trim() === "";

    if (isMissing) {
      missingFields.push(field);
    } else {
      completedFields.push(field);
    }
  });

  const isValid = missingFields.length === 0;

  return {
    isValid,
    missingFields,
    completedFields,
    totalRequired: REQUIRED_FIELDS.length,
    completedCount: completedFields.length
  };
}

export { validateReleasePackage };