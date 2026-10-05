import React from "react";

const textOrEmpty = (value) => (typeof value === "string" ? value : "");

const FinalReviewedBrief = ({ release }) => {
  const analysis = release?.analysis || {};
  const review = release?.review || {};
  const impactAnalysis = Array.isArray(analysis.impactAnalysis)
    ? analysis.impactAnalysis
    : [];
  const risks = Array.isArray(analysis.risks) ? analysis.risks : [];
  const knownLimitations = Array.isArray(release?.package?.knownLimitations)
    ? release.package.knownLimitations
    : [];
  const migrationNotes = Array.isArray(release?.package?.migrationNotes)
    ? release.package.migrationNotes
    : [];

  if (release?.status !== "approved") {
    return (
      <p className="mt-6 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600 shadow-sm">
        Final reviewed brief is available after approval.
      </p>
    );
  }

  const evidence = [
    ...(Array.isArray(analysis.evidence)
      ? analysis.evidence.map((item) => ({
          section: "Analysis",
          text: typeof item === "string" ? item : item?.text,
        }))
      : []),
    ...(Array.isArray(analysis.internalSummary?.evidence)
      ? analysis.internalSummary.evidence.map((item) => ({
          section: "Internal Summary",
          text: item,
        }))
      : []),
    ...(Array.isArray(analysis.stakeholderSummary?.evidence)
      ? analysis.stakeholderSummary.evidence.map((item) => ({
          section: "Stakeholder Summary",
          text: item,
        }))
      : []),
    ...impactAnalysis.flatMap((item) =>
      Array.isArray(item?.evidence)
        ? item.evidence.map((text) => ({ section: "User Impact", text }))
        : typeof item?.evidence === "string" && item.evidence.trim()
          ? [{ section: "User Impact", text: item.evidence }]
          : []
    ),
    ...risks.flatMap((item) =>
      Array.isArray(item?.evidence)
        ? item.evidence.map((text) => ({ section: "Risks", text }))
        : typeof item?.evidence === "string" && item.evidence.trim()
          ? [{ section: "Risks", text: item.evidence }]
          : []
    ),
  ].filter((item) => typeof item.text === "string" && item.text.trim());

  const renderList = (items, emptyText) =>
    items.length ? (
      <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
        {items.map((item, index) => {
          const value =
            typeof item === "string"
              ? item
              : item && typeof item === "object"
                ? item.text || item.note || item.value
                : "";
          return <li key={index}>{textOrEmpty(value) || "—"}</li>;
        })}
      </ul>
    ) : (
      <p className="text-sm text-gray-500">{emptyText}</p>
    );

  const renderField = (label, value) =>
    textOrEmpty(value) ? (
      <p className="text-sm text-gray-700">
        <span className="font-medium">{label}:</span> {value}
      </p>
    ) : null;

  return (
    <section
      aria-labelledby="final-reviewed-brief-title"
      className="mt-6 rounded-xl border border-green-200 bg-white p-5 shadow-sm sm:p-7"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="final-reviewed-brief-title"
          className="text-xl font-semibold text-gray-900"
        >
          FINAL REVIEWED BRIEF
        </h2>
        <p className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
          ✅ APPROVED
        </p>
      </div>

      <div className="mt-4 border-b border-gray-200 pb-4 text-sm text-gray-700">
        <p>
          <span className="font-medium">Release:</span>{" "}
          {release?.version || "—"}
        </p>
        <p>
          <span className="font-medium">Title:</span> {release?.title || "—"}
        </p>
      </div>

      <div className="mt-5 space-y-5">
        <section className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="mb-2 text-sm font-semibold tracking-wide text-gray-900">INTERNAL SUMMARY</h3>
          <p className="whitespace-pre-wrap text-sm text-gray-700">
            {textOrEmpty(review.internalSummary) || "No saved internal summary."}
          </p>
        </section>

        <section className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="mb-2 text-sm font-semibold tracking-wide text-gray-900">
            STAKEHOLDER SUMMARY
          </h3>
          <p className="whitespace-pre-wrap text-sm text-gray-700">
            {textOrEmpty(review.stakeholderSummary) ||
              "No saved stakeholder summary."}
          </p>
        </section>

        <section className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="mb-2 text-sm font-semibold tracking-wide text-gray-900">USER IMPACT</h3>
          {impactAnalysis.length ? (
            <div className="space-y-3">
              {impactAnalysis.map((entry, index) => {
                const item =
                  typeof entry === "string"
                    ? { item: entry }
                    : entry && typeof entry === "object"
                      ? entry
                      : {};
                const itemEvidence = Array.isArray(item.evidence)
                  ? item.evidence.filter(
                      (value) => typeof value === "string" && value.trim()
                    )
                  : typeof item.evidence === "string" && item.evidence.trim()
                    ? [item.evidence]
                    : [];

                return (
                  <article
                    key={index}
                    className="rounded-md border border-gray-200 p-3"
                  >
                    {renderField("Item", item.item)}
                    {renderField("Impact", item.impact)}
                    {renderField("Affected users", item.affectedUsers)}
                    {renderField("Reason", item.reason)}
                    {itemEvidence.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700">
                          Evidence:
                        </p>
                        {renderList(itemEvidence, "")}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              No user impact information available.
            </p>
          )}
        </section>

        <section className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="mb-2 text-sm font-semibold tracking-wide text-gray-900">RISKS</h3>
          {risks.length ? (
            <div className="space-y-3">
              {risks.map((entry, index) => {
                const risk =
                  typeof entry === "string"
                    ? { risk: entry }
                    : entry && typeof entry === "object"
                      ? entry
                      : {};
                return (
                  <article
                    key={index}
                    className="rounded-md border border-gray-200 p-3"
                  >
                    {renderField("Risk", risk.risk)}
                    {renderField("Severity", risk.severity)}
                    {renderField("Reason", risk.reason)}
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No risks available.</p>
          )}
        </section>

        <section className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="mb-2 text-sm font-semibold tracking-wide text-gray-900">KNOWN LIMITATIONS</h3>
          {renderList(knownLimitations, "No known limitations.")}
        </section>

        <section className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="mb-2 text-sm font-semibold tracking-wide text-gray-900">
            MIGRATION / CONFIGURATION NOTES
          </h3>
          {renderList(migrationNotes, "No migration or configuration notes.")}
        </section>

        <section className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="mb-2 text-sm font-semibold tracking-wide text-gray-900">EVIDENCE</h3>
          {evidence.length ? (
            <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
              {evidence.map((item, index) => (
                <li key={index}>
                  <span className="font-medium">{item.section}:</span>{" "}
                  {item.text}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No evidence available.</p>
          )}
        </section>
      </div>
    </section>
  );
};

export default FinalReviewedBrief;
