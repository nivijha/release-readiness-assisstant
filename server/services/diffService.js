const compareReleases = (release1, release2) => {
  const fields = [
    "completedFeatures",
    "bugFixes",
    "changedBehaviour",
    "qaSummary",
    "knownLimitations",
    "migrationNotes",
    "affectedUserGroups",
  ];

  const toComparableString = (value) => {
    if (Array.isArray(value)) {
      return value.map((item) => (item == null ? "" : String(item))).join("\n");
    }

    return value == null ? "" : String(value);
  };

  return fields.map((field) => {
    const oldValue = toComparableString(release1?.package?.[field]);
    const newValue = toComparableString(release2?.package?.[field]);
    return {
      field,
      oldValue,
      newValue,
      changed: oldValue !== newValue,
    };
  });
};

export default { compareReleases };