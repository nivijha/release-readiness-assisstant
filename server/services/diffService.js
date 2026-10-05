// Compare release versions
// Detect changed fields between two releases

const compareReleases = (release1, release2) => {
  const fields = [
    "completedFeatures",
    "bugFixes",
    "changedBehaviour",
    "qaSummary",
    "knownLimitations",
    "migrationNotes",
    "affectedUserGroups"
  ];

  const comparison = fields.map(field => {
    const oldValue = release1?.package?.[field];
    const newValue = release2?.package?.[field];
    const changed = String(oldValue) !== String(newValue);

    return {
      field,
      oldValue: Array.isArray(oldValue) ? oldValue : (oldValue || ""),
      newValue: Array.isArray(newValue) ? newValue : (newValue || ""),
      changed
    };
  });

  return comparison;
};

export default { compareReleases };