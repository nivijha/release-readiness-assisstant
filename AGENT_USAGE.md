# Agent Usage

## 1. Purpose

An AI coding agent was used to accelerate implementation, debugging, documentation, and verification of the Release Communication and Readiness Brief Assistant application while the final application behavior was manually reviewed and validated. The agent assisted with code generation, error fixing, and documentation, but all final state and behavior was confirmed through source inspection, build verification, and browser testing.

## 2. Tools Used

The following tools were actually used during development:

- **AI coding agent** (Nemotron model via opencode) — Code generation, refactoring, and debugging assistance
- **Git/GitHub** — Version control and code management
- **Node.js / npm** — Package management and build/run scripts
- **Vite** — Frontend build tool
- **Express** — Backend web framework
- **Mongoose** — MongoDB ODM
- **Gemini API** — AI analysis service
- **Vite dev server** — Frontend development server
- **Chrome DevTools** — Browser debugging and network inspection

## 3. Representative Prompts

The following representative prompts were used during development. They are labeled as representative examples rather than exact historical transcripts.

### Backend setup
"Create the Express backend with Mongoose schema for Release, including fields for releaseId, version, package, generatedBrief, analysis, status, review, timestamps, and the seven required package fields."

### Validation
"Implement deterministic validation of the required release fields (completedFeatures, bugFixes, changedBehaviour, qaSummary, knownLimitations, migrationNotes, affectedUserGroups). The validation should check that none are null, undefined, or whitespace-only."

### AI workflow
"Implement the Gemini AI analysis flow: build a strict prompt requesting JSON output with impactAnalysis, missingInformation, unsupportedClaims, risks, internalSummary, and stakeholderSummary. Validate the response structure server-side. Return success/false with the analysis object."

### Human review
"Implement editable internal/stakeholder summaries after AI analysis: make the AI textareas editable, maintain separate frontend state for edited values, add a Save Review API endpoint, and implement Approve/Reject endpoints that set status and review timestamps."

### Versioning
"Implement version preservation: add releaseSeriesId and previousReleaseId to the Mongoose schema, create a POST /api/releases/:releaseId/versions endpoint that creates a new Release document preserving the package and resetting analysis/review, and a GET /api/releases/:releaseId/versions endpoint that returns all versions in the series."

### Version comparison
"Implement a diff service that compares two releases and identifies which of 7 package fields (completedFeatures, bugFixes, changedBehaviour, qaSummary, knownLimitations, migrationNotes, affectedUserGroups) changed or remained unchanged using exact string/array comparison."

### Stale detection
"Implement stale statement detection logic: when comparing two versions, if a field value differs, note that the previous statement may be stale."

### Debugging
"Fix the ReferenceError: isValidating is not defined crash in Dashboard.jsx — add the missing useState declaration and ensure the validation handler calls setIsValidating(true)/(false)."

"Fix the Duplicate version number issue in createNewVersion — add duplicate detection and DRAFT source check before creating a new version."

"Fix the backward-compatibility issue in getReleaseVersions — the original release (v2.4.0) was created before releaseSeriesId existed, so the query must support both modern releases with releaseSeriesId and the founder release whose releaseId equals the series ID."

## 4. Delegated Work

The following implementation areas were delegated to the coding agent:

- Full MongoDB schema design and implementation (Release model with analysis, review, releaseSeriesId, previousReleaseId)
- Backend route creation (all 9 API endpoints: validate, create, analyze, review, approve, reject, create new version, get versions, compare versions)
- Backend controller handlers (saveReview, approveRelease, rejectRelease, createNewVersion, getReleaseVersions, compareReleases)
- Frontend API service methods (saveReview, approveRelease, rejectRelease, createNewVersion, getVersions, compareReleases)
- BriefPanel component with editable summaries and Save button
- Dashboard.jsx full workflow state management and UI
- VersionHistory.jsx component
- Backward-compatibility fixes for getReleaseVersions
- Build error resolution (multiple instances)
- Reference error fixes (isValidating, isAnalyzing, isCreatingVersion)

## 5. Important Agent Mistakes / Corrections

The following real issues were encountered during development and how they were corrected:

### 1. Deployed frontend initially used an incorrect API path
- **Problem:** The frontend axios instance was configured with a wrong baseURL, causing all API calls to fail.
- **Detection:** Network tab in Chrome DevTools showed failing requests.
- **Correction:** Changed `baseURL` from incorrect path to `http://localhost:5000/api` in `client/src/services/api.js`.
- **Verification:** All API requests (validate, create, analyze, saveReview, approve, reject) now return 200 responses.

### 2. Frontend/backend response shape mismatch
- **Problem:** The Dashboard component expected `analysis.internalSummary.text` but the backend/controller returned the analysis in a different nested structure.
- **Detection:** Console errors during runtime and build failures.
- **Correction:** Added `normalizeAnalysis` helper in Dashboard.jsx to safely normalize the AI response regardless of structure. Ensured `analysis` state is always an object with expected fields.
- **Verification:** Build passes; AI analysis panels render correctly.

### 3. Mongoose schema mismatch for nested AI analysis objects
- **Problem:** The initial Mongoose schema had `analysis.internalSummary` as a flat string, but the AI produces `{ text: "..." , evidence: [...] }`. The create and handleAnalyzeRelease handlers had to be updated to match the correct structure.
- **Detection:** Build failures and runtime errors when accessing `analysis.internalSummary.text`.
- **Correction:** Updated `server/models/Release.js` schema to use `summarySchema` (with `text: String, evidence: [String]`) for both `analysis.internalSummary` and `analysis.stakeholderSummary`. Updated `createRelease` and `handleAnalyzeRelease` controllers to match.
- **Verification:** Schema validates; AI analysis persists correctly; panels display analysis data.

### 4. AI analysis initially was not persisted correctly for approval
- **Problem:** The `approvalRelease` controller handler checked `hasSavedReview` but the `saveReview` handler didn't properly persist the reviewed summaries in a way the approval check could use.
- **Detection:** Approve endpoint returned 400 "Saved review summaries are required."
- **Correction:** Updated `saveReview` handler to store `release.review.internalSummary` and `release.review.stakeholderSummary` with `release.review.reviewedAt = new Date()`. Updated the approval check to verify `release.review.reviewedAt` exists and both summary fields are non-empty strings.
- **Verification:** Approve flow works end-to-end: create → analyze → save review → approve.

### 5. Version-history persistence/backward-compatibility issues
- **Problem:** The `getReleaseVersions` query `{ releaseSeriesId: seriesId }` only found modern releases with `releaseSeriesId` explicitly set, but did not find the original release (v2.4.0) that was created before `releaseSeriesId` existed.
- **Detection:** Version History UI showed only new versions, not the founder release.
- **Correction:** Modified the query to use `$or: [{ releaseSeriesId: seriesId }, { releaseId: seriesId }]`, which finds both modern releases and the founder release.
- **Verification:** Version History now shows both v2.4.0 (APPROVED) and v2.4.1 (DRAFT) as expected.

### 6. New-version UI initially failed to switch to the newly created draft
- **Problem:** After creating a new version via the API, the Dashboard state wasn't updated to show the new version; the UI remained on the old release.
- **Detection:** User clicked "Create New Version" but saw the old release data still.
- **Correction:** Updated `handleCreateVersion` in Dashboard.jsx to call `setCreatedRelease(result.release)` and reset `setAnalysis(null)`, `setEditedInternalSummary("")`, `setEditedStakeholderSummary("")`, `setReviewSaved(false)`, `setReleaseStatus("draft")` after the new version is created.
- **Verification:** After creating a new version, the Dashboard displays the new draft release with empty analysis, ready for the user to begin the Analyze → Review → Approve workflow.

### 7. Frontend build/JSX/import errors encountered and fixed
- **Problem:** Multiple build failures due to invalid JSX (invalid attribute names, missing imports, undeclared states).
- **Detection:** `npm run build` failed with esbuild errors.
- **Correction:** Fixed by: (a) adding missing `useState` declarations (isValidating, isCreating, isAnalyzing, isCreatingVersion, newVersion, showCreateVersion, comparisonLoading, selectedVersion1, selectedVersion2, editedInternalSummary, editedStakeholderSummary, reviewSaved); (b) fixing JSX syntax (removing invalid `options={}` attribute, using `<>` fragments instead); (c) removing duplicate exports; (d) ensuring all referenced variables are in scope.
- **Verification:** `npm run build` passes with 97 modules transformed and zero errors.

## 6. Rejected or Intentionally Avoided Suggestions

The following scope decisions were made to keep the implementation focused:

- **No RAG** — Excluded to maintain focus on deterministic release-readiness workflow.
- **No vector database** — Same reason.
- **No Git integration** — Excluded; the assignment focuses on release readiness, not version control.
- **No Jira integration** — Excluded for the same reason.
- **No authentication** — Excluded; the assignment doesn't require it, and adding it would scope-crease.
- **No Redis** — Excluded; not needed for the core workflow.
- **No Docker** — Excluded; the app runs with direct Node.js execution.
- **No automated deployment/rollback** — Excluded; the assignment is a local-web-application.
- **No microservices** — Excluded; a single Express backend suffices.

These were excluded to keep the implementation focused on the required release-readiness workflow, as specified in the assignment.

## 6. Verification Process

The output was verified through the following methods:

- **Source inspection:** All modified files were reviewed to ensure correctness.
- **Frontend production build:** `npm run build` passed with zero errors across all priority implementations.
- **Backend startup:** The Express server starts without errors; MongoDB connection is attempted only if `MONGODB_URI` is configured.
- **REST endpoint testing:** Each endpoint was verified to return the expected JSON structure and HTTP status codes.
- **MongoDB persistence checks:** Mongoose schema validation; documents are saved and retrieved correctly.
- **Browser testing:** The application was tested in Chrome, confirming:
  - The full workflow: Fill → Validate → Create → Analyze → Edit → Save Review → Approve/Reject
  - Version creation preserves the original release
  - Version history shows both founder and derived versions
  - Version comparison identifies changed/unchanged fields
  - Create New Version button is disabled for non-approved releases
  - Approve/Reject workflows set correct status
- **Chrome DevTools console:** No JavaScript runtime errors; all `ReferenceError` crashes were fixed.
- **Network request inspection:** All API calls returned expected responses (200 for success, 400/404/409 for errors).
- **AI response verification:** Gemini AI responses were verified to have the correct structure (impactAnalysis, missingInformation, unsupportedClaims, risks, internalSummary, stakeholderSummary).
- **Review/approval workflow testing:** End-to-end flow confirmed: analyze → save review → approve sets status="approved"; analyze → save review → reject sets status="rejected".
- **Version persistence testing:** New versions are created with correct `releaseSeriesId`, `previousReleaseId`, and `status: "draft"`; original release remains unchanged.
- **Stale statement testing:** Version comparison correctly identifies changed/unchanged package fields.
- **Deployed application testing:** The application was run locally and verified end-to-end.

Clearly distinguish automated verification (build passes, API responses) from manual verification (browser testing, workflow testing).

## 7. Human Oversight

AI-generated implementation and AI-generated release analysis were **not blindly accepted**. The following oversight was performed:

- **Code/build verification:** All changes were verified with `npm run build` passing zero errors.
- **Manual browser testing:** The complete workflow was tested manually in Chrome, confirming each step works as specified.
- **Human editing of AI summaries:** Users can edit the AI-generated internal and stakeholder summaries; the original AI analysis is preserved.
- **Human approval before final release:** The [Approve Release] button must be clicked; the AI does not automatically approve.
- **Explicit review of generated claims:** Before saving review, users should verify the AI-generated summaries and edit if needed.

The AI was treated as a tool to generate initial insights, not as an authoritative decision-maker. All AI output was subject to human review and editing before the release is approved or rejected.