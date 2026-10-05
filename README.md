# Release Communication and Readiness Brief Assistant

## 1. Overview

The **Release Communication and Readiness Brief Assistant** is a full-stack web application that helps teams manage release readiness and communicate release changes effectively.

**Core Problem:** Release information is often scattered across different documents and stakeholders, requiring manual effort to determine user impact, identify missing information, flag unsupported claims, assess risks, and generate appropriate communication briefs. This application centralizes that process.

**What it does:** The application accepts a structured release package as input, performs deterministic validation of required sections, uses Gemini AI to analyze the package, and produces structured insights including impact analysis, missing information, unsupported claims, risks, and internal/stakeholder summaries. Critically, it implements a human review workflow where generated summaries can be edited before the release is approved or rejected.

The workflow flows: Fill release form → Validate → Create Release → Analyze Release → Edit summaries → Save Review → Approve/Reject → Create New Version → Version Comparison.

## 2. Key Features

The following features are **implemented** in this application:

- **Required-release-section validation:** Deterministic check that all required fields (completedFeatures, bugFixes, changedBehaviour, qaSummary, knownLimitations, migrationNotes, affectedUserGroups) are present and not empty.
- **Release creation:** Persists release packages to MongoDB with version, title, package metadata, generatedBrief, and analysis fields.
- **AI-based user impact classification:** Gemini AI analyzes the release package and produces impact analysis (classified as Low/Medium/High), missing information, unsupported claims, and risks.
- **Missing information detection:** AI identifies items of useful missing information for release readiness.
- **Unsupported claim detection:** AI identifies claims that are not supported by the supplied QA evidence.
- **Risk identification:** AI identifies risks and classifies their severity (Low/Medium/High).
- **Internal summary generation:** AI generates a technical summary for developers, QA, and release managers.
- **Stakeholder summary generation:** AI generates a client-friendly summary for stakeholders and non-technical users.
- **Evidence/source information:** Impact analysis items, unsupported claims, and risks include source evidence and reasoning.
- **Human editing of generated summaries:** Users can edit the AI-generated internal and stakeholder summaries without modifying the original AI analysis.
- **Review and approval/rejection workflow:** Users can save reviewed summaries, approve the release (status → "approved"), or reject it (status → "rejected") with a reason.
- **Release version preservation:** Creating a new version preserves the original release completely untouched; a new document is created with copied package data and reset analysis/review.
- **Version history:** All versions in a release series can be listed, showing version number, status, and lineage (previousReleaseId).
- **Version comparison:** Compares two releases from the same series and identifies which package fields changed or remained unchanged.
- **Loading, validation, success, and failure states:** The UI provides appropriate feedback at each step of the workflow.

## 3. Application Workflow

The application implements the following step-by-step workflow:

1. **Enter release package** — Fill in the release form with version, title, release date, completed features, bug fixes, changed behavior, QA summary, known limitations, migration notes, and affected user groups.
2. **Validate required sections** — The application validates that all 7 required fields are present and not empty.
3. **Create/persist release** — The release is saved to MongoDB with status "draft". A releaseId and version are assigned.
4. **Run AI analysis** — The validated release package is sent to Gemini AI for analysis. The AI produces impactAnalysis, missingInformation, unsupportedClaims, risks, internalSummary, and stakeholderSummary.
5. **Review impact, missing information, unsupported claims, and risks** — The AI analysis appears in panels: ImpactPanel, MissingInformationList, UnsupportedClaimsPanel, RisksPanel.
6. **Edit generated summaries if required** — Users can edit the AI-generated internal summary and stakeholder summary. The original AI analysis is preserved; a separate reviewed state is maintained.
7. **Save review** — The user-edited summaries are saved via PUT /api/releases/:releaseId/review. The AI analysis is preserved unchanged.
8. **Approve or reject release** — 
   - **Approve:** Sets status to "approved", stores approval timestamp. The AI must never automatically approve; this happens only when the user clicks [Approve Release].
   - **Reject:** Sets status to "rejected", stores the rejection reason and timestamp.
9. **Create a new release version after approval** — From an approved release, a new version can be created. The original approved release remains completely untouched; a new draft release is created with copied package data, inherited release series ID, and previousReleaseId linking to the source.
10. **Compare different release versions** — Users can select two versions from the same series and compare them. The comparison identifies which of the 7 package fields (completedFeatures, bugFixes, changedBehaviour, qaSummary, knownLimitations, migrationNotes, affectedUserGroups) changed or remained unchanged.
11. **Detect stale statements** — When comparing versions, statements that differ between versions may indicate stale previous statements.
12. **View final reviewed brief after approval** — After approval, the release status shows "APPROVED" and the reviewed brief (edited summaries, approval timestamp) is displayed.

Only steps 1–8 are fully implemented in the current version. Steps 9–12 are implemented as part of Priority 2 and Priority 3.

## 4. Architecture

**Frontend:**
- React with Vite
- Tailwind CSS for styling
- Axios for API calls
- React Router for navigation

**Backend:**
- Node.js with Express
- RESTful API
- Mongoose ODM for MongoDB

**Database:**
- MongoDB

**AI:**
- Gemini API (server-side only; API key never sent to frontend)

**Request Flow:**

```text
Browser
  |
  v
React + Vite frontend
  |
  | REST API calls (Axios)
  v
Express Backend
  |
  +----- Validation Service (deterministic field checks)
  |
  +----- AI Service (Gemini API calls)
  |
  +----- Release Controller (route handlers)
  |
  v
MongoDB (persistent storage)
```

## 5. Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 | UI library |
| Frontend | Vite 5 | Build tool and dev server |
| Frontend | Tailwind CSS 3 | Styling |
| Frontend | Axios 1 | HTTP client |
| Frontend | React Router DOM 6 | Navigation |
| Backend | Node.js | Runtime |
| Backend | Express 4 | Web framework |
| Backend | Mongoose 8 | MongoDB ODM |
| Database | MongoDB | Document database |
| AI | Gemini Flash | AI analysis (server-side only) |

## 6. Data Model

The **Release** MongoDB schema includes the following important fields:

| Field | Type | Description |
|-------|------|-----------|
| `releaseId` | String | Unique release identifier |
| `version` | String | Release version (e.g., "1", "2.4.0") |
| `title` | String | Release title |
| `package` | Object | Release package data containing: completedFeatures, bugFixes, changedBehaviour, qaSummary, knownLimitations, migrationNotes, affectedUserGroups |
| `generatedBrief` | Object | AI-generated brief: internalSummary, stakeholderSummary |
| `analysis` | Object | Full AI analysis: impactAnalysis, missingInformation, unsupportedClaims, risks, internalSummary, stakeholderSummary |
| `status` | String | Current state: "draft", "approved", "rejected" |
| `review` | Object | Human-reviewed content: internalSummary, stakeholderSummary, reviewedAt, approvedAt, rejectionReason |
| `releaseSeriesId` | String | Groups versions belonging to the same release series |
| `previousReleaseId` | String | Links a version to its predecessor |
| `createdAt` | Date | Timestamp |
| `updatedAt` | Date | Timestamp |

**Key distinctions:**

- **Package data:** The release package contents (features, fixes, behavior changes, etc.). Preserved when creating new versions.
- **AI analysis:** The Gemini-produced impactAnalysis, missingInformation, unsupportedClaims, risks, internalSummary, stakeholderSummary. **Never overwritten** when saving review edits.
- **Human review:** The user-edited summaries stored in `review.internalSummary` and `review.stakeholderSummary`. Separate from AI-generated content.
- **Release status:** "draft" → after analysis: "analyzed" → after approve: "approved" → after reject: "rejected".
- **Version lineage:** `previousReleaseId` traces back to the source release; `releaseSeriesId` groups all versions of the same release.

## 7. API Endpoints

The following **implemented** endpoints exist:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/releases/validate` | Validate release package fields |
| `POST` | `/api/releases` | Create a new release (status: draft) |
| `POST` | `/api/releases/analyze` | Run AI analysis on a release |
| `PUT` | `/api/releases/:releaseId/review` | Save user-edited summaries |
| `POST` | `/api/releases/:releaseId/approve` | Approve a release (status → "approved") |
| `POST` | `/api/releases/:releaseId/reject` | Reject a release (status → "rejected") |
| `POST` | `/api/releases/:releaseId/versions` | Create a new version from an approved release |
| `GET` | `/api/releases/:releaseId/versions` | Get all versions in the same series |
| `GET` | `/api/releases/:releaseId1/:releaseId2` | Compare two releases |
| `GET` | `/api/health` | API health check |

## 8. AI Workflow

- **AI is called server-side only.** The API key is never sent to the frontend.
- **The application first performs deterministic validation.** All 7 required fields must pass before AI is invoked.
- **The AI receives the supplied release information** (version, title, completedFeatures, bugFixes, changedBehaviour, qaSummary, knownLimitations, migrationNotes, affectedUserGroups).
- **AI classifies user impact:** Impact analysis items are classified as Low/Medium/High with reasoning.
- **AI identifies missing information:** Items useful for release readiness are reported.
- **AI identifies unsupported claims:** Claims not supported by the supplied QA evidence are explicitly identified.
- **AI identifies risks:** Risks and their severity (Low/Medium/High) are reported.
- **AI generates internal and stakeholder summaries:** Technical and client-friendly summaries are produced.
- **The AI must not invent facts or outcomes.** All statements must be based on the supplied release package.
- **Human review remains required before approval.** AI-generated content is stored separately from human-reviewed content, and approval only happens when the user explicitly clicks [Approve Release].

**Data preservation:** AI-generated analysis and human-reviewed content are stored separately in the MongoDB document. The `analysis` field retains the original AI output, while `review` stores the user-reviewed summaries, timestamps, and approval/rejection status.

## 9. Human Review and Approval

- **Generated summaries can be edited:** Users modify the AI-generated internal and stakeholder summaries in editable textareas.
- **Review can be saved:** Edited summaries are saved via the API; the original AI analysis is preserved.
- **Release can be approved:** When the user clicks [Approve Release], the status changes to "approved" and `review.approvedAt` is set.
- **Release can be rejected:** When the user clicks [Reject Release] and provides a reason, the status changes to "rejected" and `review.rejectionReason` is stored.
- **Approval represents human acceptance.** The AI does not independently approve the release; human action is required.

## 10. Versioning

The implemented versioning model works as follows:

- **Previous versions are preserved:** When a new version is created, the original release remains completely untouched in MongoDB.
- **New versions receive new release IDs:** A new `releaseId` is generated (e.g., `release-${Date.now()}`).
- **`previousReleaseId` represents lineage:** The new version's `previousReleaseId` is set to the source release's `releaseId`.
- **`releaseSeriesId` groups versions:** All versions in a series share the same `releaseSeriesId`. For the first release in a series, `releaseSeriesId` equals its own `releaseId`.
- **Creating a new version should not overwrite the previous release:** The `createNewVersion` endpoint explicitly checks for duplicate version numbers and returns HTTP 409 if the version already exists in the series. It also checks that the source release is "approved" before allowing version creation.

**Intended lifecycle:**
```
DRAFT → VALIDATE → ANALYZE → REVIEW → APPROVED → CREATE NEW VERSION → DRAFT
```

## 11. Version Comparison

The version comparison feature identifies which of the 7 package sections changed or remained unchanged between two releases from the same series:

- **Completed Features** — Changed/Unchanged
- **Bug Fixes** — Changed/Unchanged
- **Changed Behaviour** — Changed/Unchanged
- **QA Summary** — Changed/Unchanged
- **Known Limitations** — Changed/Unchanged
- **Migration Notes** — Changed/Unchanged
- **Affected User Groups** — Changed/Unchanged

Comparison uses exact string/array comparison. A field is marked `changed` if the old value differs from the new value; otherwise it is `UNCHANGED`. Changed sections are visually highlighted (red background), unchanged sections show as green.

## 12. Stale Statement Detection

When comparing two versions, if a statement differs between them, the previous statement may be stale.

**Conceptual example:**

> Previous (v2.4.0): "Imports are processed synchronously."
>
> New (v2.4.1): "Imports are processed asynchronously."
>
> **Result:** The previous statement about synchronous processing is now stale; the new version indicates asynchronous processing.

This is a simple deterministic comparison — the application does not perform advanced semantic analysis or RAG-based detection.

## 13. Setup

**Prerequisites:** Node.js installed.

1. **Clone repository:**
   ```bash
   git clone <repository-url>
   cd release-readiness-assistant
   ```

2. **Install frontend dependencies:**
   ```bash
   cd client
   npm install
   ```

3. **Install backend dependencies:**
   ```bash
   cd server
   npm install
   ```

4. **Configure environment variables:**
   Create a `.env` file in the `server` directory with:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   GEMINI_API_KEY=your_gemini_api_key
   ```

5. **Start backend:**
   ```bash
   cd server
   npm run dev
   ```

6. **Start frontend:**
   ```bash
   cd client
   npm run dev
   ```

The application will be available at `http://localhost:5173` (frontend) and `http://localhost:5000` (backend).

## 14. Environment Variables

The following environment variables are **required**:

| Variable | Purpose |
|----------|---------|
| `PORT` | Server port (default: 5000) |
| `MONGODB_URI` | MongoDB connection string |
| `GEMINI_API_KEY` | Gemini API key for AI analysis |
| `VITE_API_URL` | Base API URL (frontend proxies to this) |

**No real secrets or credentials should be committed.** Use placeholders.

## 15. Testing and Verification

The following **actual** behaviors were verified:

- **Required-field validation** — All 7 required fields must be present; validation errors are shown if missing.
- **Release creation** — A new release is persisted to MongoDB with status "draft".
- **AI analysis** — Gemini AI produces structured analysis when given valid release data.
- **Review/save** — User-edited summaries are saved; AI analysis is preserved.
- **Approve/reject** — Status changes to "approved" or "rejected" with proper timestamps.
- **Version creation** — A new version is created from an approved release; original remains untouched.
- **Version persistence** — New versions are saved with correct `releaseSeriesId`, `previousReleaseId`, and `status: "draft"`.
- **Version comparison** — Two versions can be compared; changed/unchanged fields are identified.
- **Stale statement detection** — Differences between versions are noted.

**Manual browser verification** was performed to confirm:
- Frontend build succeeds with zero errors
- All API endpoints return expected responses
- MongoDB document structure is correct
- UI states (draft, analyzed, approved, rejected) behave correctly
- Create new version workflow preserves original release
- Version comparison identifies changed/unchanged fields

No automated test framework (e.g., Jest, Cypress) is configured in this project. Verification was primarily manual through browser testing and build checks.

## 16. Logging and Error Handling

**Backend:**
- MongoDB connection errors are logged to console
- AI API errors (upstreamStatus, statusCode) are captured and returned as appropriate HTTP error responses
- Validation failures return 400 with detail
- Not-found releases return 404
- Duplicate version creation returns 409
- All errors include a `success: false` flag and message

**Frontend:**
- Loading states (`isValidating`, `isCreating`, `isAnalyzing`, `isSavingReview`, `isApproving`, `isRejecting`, `isCreatingVersion`, `comparisonLoading`) provide UI feedback
- Error messages appear in red toast/snackbar patterns
- Form inputs are disabled during pending operations
- Button availability depends on release status (e.g., [Create New Version] is only enabled for approved releases)

## 17. Deployment

The application is designed to be deployed as follows:

**Frontend:**
- Vercel or any static host that serves the Vite build artifacts

**Backend:**
- Render, Fly.io, or any Node.js host

**Database:**
- MongoDB Atlas (cloud) or self-hosted MongoDB

**AI:**
- Gemini API (requires API key configuration)

The hosted application must remain available for evaluation purposes.

## 18. Completed Scope

The following scope from the assignment has been **completed**:

- Priority 1: Human review workflow (editable summaries, save review, approve/reject)
- Priority 2: Version preservation / version history (releaseSeriesId, previousReleaseId, create new version, version history)
- Priority 3: Version comparison (compare two releases, identify changed/unchanged fields)

Additional implemented capabilities:
- Deterministic release-package validation
- Gemini AI analysis
- Release creation and persistence
- Analysis, review, approval, and rejection workflows
- Data preservation across version creation
- Backward compatibility with existing releases

## 19. Excluded Scope

The following functionality was **intentionally excluded** to maintain the assignment's focused scope:

- **Git integration** — No Git operations, commit history, or version control integration
- **Jira integration** — No Jira issue tracking or integration
- **Authentication** — No user authentication, login, or authorization
- **RAG / vector database** — No retrieval-augmented generation or vector similarity search
- **Redis** — No caching or session storage
- **Docker** — No containerization
- **Automated deployment/rollback** — No CI/CD pipelines or deployment scripts
- **Public changelog** — No public-facing change log
- **Microservices** — No service decomposition

These were excluded to keep the implementation focused on the required release-readiness workflow.

## 20. Known Limitations

The following **real limitations** apply:

- **Gemini API quota/availability** — The application depends on the Gemini API being configured and available; if the API key is missing or the service is unavailable, AI analysis cannot be completed.
- **No authentication** — Any user can create, analyze, and approve/reject releases; there is no role-based access control.
- **No Git/Jira integration** — Release data is not synchronized with any version control or issue-tracking system.
- **Limited stale-statement detection** — Stale statement detection is based on simple deterministic comparison between versions; it does not perform advanced semantic analysis.
- **Deployment dependent on external services** — The application requires MongoDB and Gemini API to be operational; without them, core features cannot function.

## 21. Demo Instructions

For evaluators:

1. Open the hosted application at the provided URL
2. Enter a sample release package (version, title, release date, completed features, bug fixes, changed behavior, QA summary, known limitations, migration notes, affected user groups)
3. Click **Validate Release** — ensure all 7 required sections are filled
4. Click **Create Release** — the release is saved with status "draft"
5. Click **Analyze Release** — AI analysis appears in the panels
6. Review the **Internal Summary** and **Stakeholder Summary** — editable textareas appear
7. Edit the summaries if desired, then click **Save Review**
8. Click **Approve Release** — status changes to "APPROVED"
9. Click **Create New Version** — enter a new version number (e.g., "v2.4.1")
10. The new version appears as "DRAFT"; the original release remains "APPROVED"
11. Click **Compare Versions** — select the two versions to compare
12. Changed package sections are highlighted; unchanged sections show as unchanged
13. View the final reviewed brief after approval

Use the actual UI element names from the application (Release Form, Validate, Create Release, Analyze Release, Internal Summary, Stakeholder Summary, Save Review, Approve Release, Reject Release, Create New Version, Version History, Version Comparison).