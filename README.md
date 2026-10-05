# Release Communication and Readiness Brief Assistant

## 1. Overview

The Release Communication and Readiness Brief Assistant is a React web application with an Express API and MongoDB persistence. It helps teams organize release information, assess readiness, and prepare internal and stakeholder-facing summaries.

Release details are often scattered, making it time-consuming to understand user impact, identify missing information and risks, and communicate changes. This application collects a structured release package, checks required sections deterministically, and can submit the package to a server-side Gemini workflow for analysis. A person reviews and can edit the generated summaries before approval.

## 2. Key Features

- **Required-section validation:** Checks the seven required package sections for missing or whitespace-only values.
- **Release creation and persistence:** Creates a draft release document in MongoDB after validation.
- **AI release analysis:** Requests structured impact analysis, missing information, unsupported claims, risks, and summaries from Gemini.
- **Evidence-oriented analysis:** Analysis records include supporting evidence or source/reason fields where the response schema defines them. Unsupported claims are assessed against the supplied QA summary.
- **Human-edited summaries:** Internal and stakeholder summaries can be edited and saved separately from the original AI analysis.
- **Review and decision workflow:** A release can be approved or rejected by a user after analysis and a saved review. Rejection may include a reason.
- **Version preservation and history:** Creating a new version creates a separate draft document, preserves its source release, and links it to the series.
- **Version comparison:** Compares package values between two different versions from the same release series.
- **Stale statement candidates:** Reports package sections that differ from the directly linked previous release. This is a deterministic value comparison, not semantic interpretation.
- **Final reviewed brief:** Displays reviewed summaries and selected analysis/package details for an approved release.
- **Interaction feedback:** The frontend has loading, success, validation, empty, and error messages for the implemented operations.

## 3. Application Workflow

1. Enter the release version, title, release date, and package details in the Release Package form.
2. Validate the seven required package sections.
3. Create the release. The API creates a draft in MongoDB.
4. Request analysis. The backend validates the package again, calls Gemini, validates the response shape, and saves the analysis on the release.
5. Review the impact analysis, missing information, unsupported claims, and risks.
6. Edit the internal and stakeholder summaries if needed.
7. Save the edited summaries as the human review.
8. Approve or reject the release. Both decisions require analysis and saved review; approval is a human action.
9. From an approved release, create the next draft version. The previous release remains a separate record.
10. View the series history and compare two distinct versions.
11. View stale statement candidates based on changes to the new version's linked predecessor.
12. View the Final Reviewed Brief when the active release is approved.

The release date is collected in the form and passed in analysis input, but it is not declared in the active MongoDB schema or assigned by the create/update controllers; see [Known Limitations](#20-known-limitations).

## 4. Architecture

**Frontend:** React 18, Vite, Tailwind CSS, Axios, and React Router DOM.

**Backend:** Node.js ES modules, Express, Mongoose, dotenv, and CORS middleware.

**Database:** MongoDB, connected by the backend using `MONGODB_URI`. The repository does not establish whether a particular deployment uses MongoDB Atlas.

**AI:** Gemini 2.5 Flash, called directly from the server-side AI service. The browser does not receive the Gemini key.

Request flow:

```text
Browser
   |
   v
React + Vite frontend
   |  Axios REST request
   v
Express API (/api/releases)
   |
   +---- Deterministic validation service
   |
   +---- Release controller ---- Mongoose ---- MongoDB
   |
   +---- AI service (analysis request only) ---- Gemini API
   |
   v
JSON response to the frontend
```

Validation, review, version management, comparison, and stale-statement checks are implemented by the Express application. Gemini is only used for the analysis operation.

## 5. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 18 | Dashboard and release workflow UI |
| Frontend build/dev server | Vite 5 | Frontend development and production build |
| Frontend styling | Tailwind CSS 3 | Utility-based UI styling |
| Frontend HTTP/routing | Axios, React Router DOM 6 | API requests and router wrapper |
| Backend | Node.js, Express 4 | HTTP API and request handling |
| Backend data access | Mongoose 8 | MongoDB models and queries |
| Database | MongoDB | Release, analysis, and review persistence |
| AI | Gemini 2.5 Flash API | Structured release analysis |
| Deployment | Not specified in repository | No provider-specific deployment manifest or URL is tracked |

## 6. Data Model

The application imports the active model from `server/models/Release.js`. Important fields are:

| Field | Purpose |
|---|---|
| `releaseId` | Unique application-level identifier |
| `version` | Release version label |
| `title` | Release title |
| `package` | `completedFeatures`, `bugFixes`, `changedBehaviour`, `knownLimitations`, `migrationNotes`, and `affectedUserGroups` are string arrays; `qaSummary` is a string |
| `analysis` | AI-generated impact analysis, missing information, unsupported claims, risks, internal summary, and stakeholder summary |
| `generatedBrief` | Schema fields for internal and stakeholder summaries; current create/version handlers initialize these as empty strings |
| `review` | Human-edited summaries, review and approval timestamps, and rejection reason |
| `status` | `draft`, `approved`, or `rejected` |
| `releaseSeriesId` | Groups releases in one version series |
| `previousReleaseId` | Links a new version to its source release |
| `createdAt`, `updatedAt` | Mongoose timestamps |

Package data is the user-supplied release content. AI analysis is stored separately from human review. A review contains the edited summaries and review metadata. Status records the workflow state. Version lineage is represented by the series ID and previous release ID. Older series can be resolved using the release ID when a legacy release has no `releaseSeriesId`.

## 7. API Endpoints

The router is mounted at `/api/releases`; the separate health endpoint is mounted at `/api/health`.

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | API health response |
| `GET` | `/api/releases/health` | Release-router health response |
| `GET` | `/api/releases` | List releases, newest first |
| `POST` | `/api/releases/validate` | Validate required package sections |
| `POST` | `/api/releases` | Validate and create a draft release |
| `GET` | `/api/releases/:releaseId` | Fetch one release |
| `PUT` | `/api/releases/:releaseId` | Update a draft release package |
| `POST` | `/api/releases/analyze` | Validate, analyze with Gemini, and persist analysis |
| `PUT` | `/api/releases/:releaseId/review` | Save reviewed summaries |
| `POST` | `/api/releases/:releaseId/approve` | Approve after analysis and saved review |
| `POST` | `/api/releases/:releaseId/reject` | Reject after analysis and saved review |
| `POST` | `/api/releases/:releaseId/versions` | Create the next draft version from an approved release |
| `GET` | `/api/releases/:releaseId/versions` | Get up to five distinct versions in the release series |
| `GET` | `/api/releases/compare/:releaseId1/:releaseId2` | Compare two different versions from the same series |
| `GET` | `/api/releases/:releaseId/stale-statements` | Find changed sections relative to the linked previous release |
| `GET` | `/api/releases/:releaseId1/:releaseId2` | Alternate comparison route also registered by the release router |

The comparison handler rejects identical normalized version labels and releases from different series. API errors use JSON responses with an error message; exact status codes depend on the failure (for example, validation, not found, or upstream AI errors).

## 8. AI Workflow

- The Gemini request is made by the backend; `GEMINI_API_KEY` is not a frontend setting.
- The analysis endpoint runs deterministic package validation before calling the AI service.
- The request includes the version/title/date and supplied package sections.
- The prompt requests impact classification, missing information, unsupported claims based on the supplied QA summary, risks, and internal/stakeholder summaries.
- The service requests JSON, parses the response, and validates the expected top-level and item structure before the controller persists it.
- The prompt instructs Gemini to use only supplied facts, preserve stated limitations, and not decide whether to approve or reject. These are prompt constraints, not a guarantee that model output is always correct.
- Human review and approval remain separate from AI analysis.

The AI analysis is stored under `analysis`; reviewed summaries and decision metadata are stored under `review`. The existing `generatedBrief` schema field is initialized empty by the create/version handlers and is not the active review store.

## 9. Human Review and Approval

The UI allows users to edit the AI-generated internal and stakeholder summaries and save them through the review endpoint. The original analysis remains separate. Approval and rejection require analysis and saved, non-empty summaries. Approval records an approval timestamp. Rejection records the provided reason, or a fallback reason when none is supplied. The AI service is explicitly instructed not to approve or reject; the API decision is triggered by a user action.

## 10. Versioning

- A new version is allowed only from an approved source release.
- The backend accepts only `vX.Y.Z` or `X.Y.Z`-style versions for automatic creation and computes a free next minor version (`Y + 1`, patch reset to `0`).
- A new MongoDB document gets a new `releaseId`, inherits the series ID (with a legacy fallback), and records the source in `previousReleaseId`.
- The package values are copied into the new draft. Analysis and review are reset.
- The source record is not overwritten by the create-new-version handler.
- The version-history endpoint sorts newest first and limits the database query to five; duplicate version labels are collapsed in the response. The UI also caps the list at five.

Comparison is for two different release versions, for example `v3.0.0 → v3.1.0`, not separate draft and approved states of the same version.

## 11. Version Comparison

The comparison service checks these seven package fields:

- Completed Features (`completedFeatures`)
- Bug Fixes (`bugFixes`)
- Changed Behaviour (`changedBehaviour`)
- QA Summary (`qaSummary`)
- Known Limitations (`knownLimitations`)
- Migration Notes (`migrationNotes`)
- Affected User Groups (`affectedUserGroups`)

Array values are converted to newline-joined strings and scalar values to strings before exact comparison. Each section is returned with old/new values and a `changed` boolean. This is not a semantic or AI-generated diff.

## 12. Stale Statement Detection

The stale-statement endpoint loads the current release and its directly linked `previousReleaseId`. It uses the same package diff logic and returns each changed section as a possible stale statement, with old/current versions, values, and a fixed explanation. If there is no linked predecessor, it returns an empty list.

Conceptually, if a previous version says “Imports are processed synchronously” and the new version says “Imports are processed asynchronously,” the old statement is returned as a possible stale statement because that package value changed. The implementation does not perform advanced semantic analysis.

## 13. Setup

**Prerequisite:** Node.js and npm.

1. Clone the repository:

   ```bash
   git clone https://github.com/nivijha/release-readiness-assisstant.git
   cd release-readiness-assisstant
   ```

2. Install frontend and backend dependencies in separate terminals or sequentially:

   ```bash
   cd client
   npm install
   cd ../server
   npm install
   ```

3. Configure environment variables. The backend loads `server/.env`; Vite reads its frontend environment from the `client` directory. See [Environment Variables](#14-environment-variables) and the root `.env.example`.

4. Start the backend:

   ```bash
   cd server
   npm run dev
   ```

5. Start the frontend in another terminal:

   ```bash
   cd client
   npm run dev
   ```

Vite prints the frontend URL when started (normally `http://localhost:5173`). The backend defaults to port `5000`; its health endpoint is `http://localhost:5000/api/health`. MongoDB operations require a usable `MONGODB_URI`; AI analysis additionally requires a usable `GEMINI_API_KEY`.

To build the frontend for production:

```bash
cd client
npm run build
```

There is no root-level package manifest or backend build script in the repository.

## 14. Environment Variables

| Variable | Read by | Purpose |
|---|---|---|
| `PORT` | Backend | Express listen port; defaults to `5000` |
| `MONGODB_URI` | Backend | MongoDB connection string |
| `GEMINI_API_KEY` | Backend | Key for server-side Gemini analysis |
| `VITE_API_BASE_URL` | Frontend build/dev | Axios API base URL; defaults to `http://localhost:5000/api` |

The root `.env.example` lists variable names with safe placeholders. Copy the backend variables to `server/.env` and the frontend variable to a Vite environment file under `client/`. Do not commit populated environment files or credentials.

## 15. Testing and Verification

**Automated tests:** No test files or `test` script are present in the client or server package manifests. The client has a production build command; the server package has a development command but no build/test command.

**Recorded verification:** The frontend production build was run during development and completed successfully. Prior task notes also record backend syntax checks and a focused mocked version-history query/workflow check. Those focused checks are not committed as a repeatable automated test suite.

**Manual/interactive verification:** The source and route wiring were inspected while implementing and documenting the workflow. A complete live, deployed browser-to-database run is not established by the repository, so this README does not claim one. In particular, populated external release data and deployment service availability must be verified in the evaluator's environment.

For local verification, run `npm run build` in `client`, start the server with the required environment configured, and exercise the workflow using a test MongoDB database and a valid Gemini key. Avoid running demo writes against production data.

## 16. Logging and Error Handling

- The backend logs server startup and MongoDB connection success/failure to the console.
- Controller operations log selected failures and some analysis/review readiness information.
- The AI service logs Gemini request/upstream errors and returns analysis errors through the API.
- API handlers return JSON error messages and relevant HTTP error statuses for validation, unavailable database, not-found records, invalid workflow state, and AI failures.
- The frontend displays operation-specific loading, validation, empty, and error states. Some request failures are also logged to the browser console.

## 17. Deployment

The tracked repository does not include a Vercel, Render, Fly.io, Netlify, Docker, or other provider deployment manifest, nor does it contain a verified hosted application URL. Therefore a specific deployed architecture cannot be confirmed from the codebase.

The application can be deployed as a Vite static frontend and a Node/Express backend configured to reach MongoDB and the Gemini API. The frontend must be built with `VITE_API_BASE_URL` pointing to the deployed API base, and the backend must have `PORT`, `MONGODB_URI`, and `GEMINI_API_KEY` configured in its hosting environment. Supply the hosted evaluation URL separately; none is documented here.

## 18. Completed Scope

The source implements the structured release package, deterministic validation, MongoDB-backed release operations, Gemini analysis, editable/saved review summaries, human approval/rejection, version creation/history, package comparison, stale-statement candidates, and the approved final reviewed brief. Version history is limited to the five most recent releases returned by the backend.

## 19. Excluded Scope

The repository does not implement Git or Jira integration, authentication/authorization, RAG or a vector database, Redis, Docker/container orchestration, microservices, an automated deployment/rollback pipeline, or a public changelog. These are outside the implemented release-readiness workflow.

## 20. Known Limitations

- **External dependencies:** Persistent operations require a reachable MongoDB instance. AI analysis requires Gemini credentials and service availability/quota.
- **No authentication:** The API has no user authentication or role-based authorization.
- **No tracked deployment target:** A host URL/provider cannot be inferred from the checked-in configuration.
- **Release date/title persistence:** The form collects a release date, but `releaseDate` is absent from the active schema and create/update handlers. The initial create handler also does not assign the submitted title, although the schema has a `title` field and draft updates can assign it.
- **Simple change detection:** Version comparison and stale candidates use exact value comparison after converting arrays to newline-separated strings; they do not determine semantic equivalence or whether a changed statement is truly stale.
- **AI output needs review:** The prompt requests evidence-based output, but a user should verify generated claims before saving a review and making a release decision.
- **No automated test suite:** The repository does not contain a configured unit/integration test suite.

## 21. Demo Instructions

Use a test MongoDB database and a server configured with a Gemini key. Open the locally running UI or the evaluation URL supplied separately:

1. Enter the seven required release package sections.
2. Click **Validate Release**, then **Create Release**.
3. Click **Analyze Release**.
4. Review the impact, missing information, unsupported claims, risks, and summaries.
5. Edit the internal and stakeholder summaries and click **Save Review**.
6. Click **Approve Release** or **Reject Release**.
7. For an approved release, click **Create New Version**. The backend creates a new draft with an automatically selected minor version.
8. Edit and save the new draft, then analyze/review it as needed.
9. Use **Version History** and **Version Comparison** to inspect the series and compare two versions.
10. Review **Stale Statement Detection** for sections that differ from the linked predecessor.
11. After approval, inspect **FINAL REVIEWED BRIEF**.
