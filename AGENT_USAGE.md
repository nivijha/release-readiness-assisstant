# Agent Usage

## 1. Purpose

An AI coding agent in VS Code was used to assist with implementation tasks, debugging, verification, and documentation for the Release Communication and Readiness Brief Assistant. Its suggestions and code changes were reviewed against the repository, and builds or focused checks were used where available. AI-generated release content is also subject to the application's separate human review and approval workflow.

## 2. Tools Used

Tools evidenced in the development and repository work:

- **AI coding agent in VS Code:** Assisted with code inspection, implementation changes, and documentation.
- **Git:** Used to inspect repository state and changes.
- **Node.js/npm:** Used for dependency management and the frontend build.
- **Vite:** Used to build the React frontend.
- **Gemini API:** Runtime provider called by the backend AI service; it is not a coding or test tool.
- **MongoDB/Mongoose:** Runtime persistence layer. A particular MongoDB hosting provider is not established in the checked-in configuration.

Vercel, Render, MongoDB Atlas, and Chrome DevTools are not claimed as verified development/deployment tools here: no provider configuration or reproducible browser-test record is included in the repository available for this documentation pass.

## 3. Representative Prompts

These are representative descriptions of user-directed work, not exact historical transcripts.

### Backend setup

“Inspect the existing project and implement the Express/Mongoose release API using the existing package structure and Release model. Do not introduce unrelated infrastructure.”

### Validation

“Implement deterministic validation for the seven required release package sections and return which sections are missing.”

### AI workflow

“Use Gemini server-side to analyze the supplied package for impact, missing information, unsupported claims based on supplied QA evidence, risks, and internal/stakeholder summaries. Validate the returned structure and keep the API key out of the frontend.”

### Human review

“Keep AI analysis separate from human-edited summaries. Allow users to save the edited summaries and require saved review before approve/reject actions.”

### Versioning

“Create a new draft as a separate release record from an approved release, preserve the old release, and maintain release-series and previous-release links, including compatibility for records without a series ID.”

### Version comparison

“Compare the seven package fields between two different releases in the same series, show changed/unchanged values, and reuse the existing diff service.”

### Stale detection

“Use the linked previous release and existing package comparison to display fields whose previous values changed; do not add semantic AI or RAG behavior.”

### Debugging

“Inspect the version-history rendering and loading state, keep a single Dashboard mount, and verify the frontend production build without changing the backend.”

“Correct the documentation environment-variable names and deployment/test claims to match the actual code and repository configuration.”

## 4. Delegated Work

No separate subagent, contractor, or external implementation team is evidenced in the available repository/session record. The user delegated scoped implementation requests to the coding agent, which assisted with:

- Express routes, release controller operations, validation, and Mongoose release persistence.
- Gemini analysis service integration and analysis response handling.
- Frontend release form, dashboard state, review controls, version history/comparison, stale statement display, and final reviewed brief.
- Debugging issues reported during release editing, history persistence/loading, comparison, and production builds.
- This documentation correction.

These were agent-assisted implementation tasks, not independently delegated subprojects. The repository does not include a task log proving which individual code lines were initially authored by a human versus the agent.

## 5. Important Agent Mistakes / Corrections

### 1. Version history did not include legacy series records

- **Problem:** A series query based only on `releaseSeriesId` could miss an older founder release without that field.
- **Detection:** Version-history behavior was reported as incomplete for older releases and the controller's series lookup was inspected.
- **Correction:** The active controller resolves the series ID with a fallback to the source release ID and queries both the series field and the founder release ID.
- **Verification:** A focused mocked history-query check was recorded during implementation. Live historical data was not fully verified against a deployed database.

### 2. New draft was not immediately active in the UI

- **Problem:** After version creation, the form could remain bound to the source release state.
- **Detection:** The reported flow showed the new database record but inconsistent frontend state.
- **Correction:** The Dashboard adopts the release returned by the create-version response as its active release and resets analysis/review UI state; the form synchronizes from the active release.
- **Verification:** The UI state path was inspected and mocked workflow checks were recorded; a complete live database flow is not claimed here.

### 3. Duplicate/loading version-history presentation was reported

- **Problem:** The deployed UI was reported to show repeated history/comparison headings and loading text.
- **Detection:** The frontend render tree and source references were searched. The inspected source had one parent `<VersionHistory>` mount; the component itself owns the history and comparison sections and loading state.
- **Correction:** Kept the single component instance and its loading/success/error content within one stable section, and positioned it after review/approval in the Dashboard.
- **Verification:** Source search found one Dashboard mount and one comparison heading; the production bundle contained each heading and the loading message once. The production build succeeded.

### 4. JSX nesting error in the version-history component

- **Problem:** A production build reported mismatched closing `section` and `div` tags in `VersionHistory.jsx`.
- **Detection:** Vite/esbuild reported the component file and line numbers.
- **Correction:** Matched the list/result container and parent section closing tags.
- **Verification:** The subsequent `npm run build` completed successfully.

### 5. Documentation had inaccurate environment and verification claims

- **Problem:** The root example used `VITE_API_URL`, while the frontend reads `VITE_API_BASE_URL`. Existing prose also described deployment providers and broad browser/API verification that were not supported by tracked configuration or reproducible test files.
- **Detection:** Inspected the active Axios service, environment templates, package manifests, server entry point, and tracked deployment files.
- **Correction:** This documentation pass uses the actual variable name, documents only configured commands/routes, and explicitly marks hosting and live end-to-end verification as unconfirmed.
- **Verification:** Compared the documented variable names with source references, routes with the Express router, and test/deployment statements with package manifests and tracked files.

## 6. Rejected or Intentionally Avoided Suggestions

- **No RAG or vector database:** No retrieval/indexing requirement or implementation exists.
- **No AI-based comparison or stale detection:** Existing comparison is a deterministic package-value diff; extending it would change behavior and scope.
- **No authentication, Git/Jira integration, Redis, Docker, or microservices:** These are not part of the current implementation and would require additional product and deployment decisions.
- **No invented deployment provider or URL:** Repository configuration does not verify one, so documentation does not claim Vercel, Render, Atlas, or a public hosted URL.
- **No claim of an automated test suite:** There are no test files or test scripts in the package manifests; builds and focused checks are described separately.
- **No application source changes for this documentation task:** Only README.md, AGENT_USAGE.md, and the root `.env.example` are in scope.

## 7. Verification Process

### Automated and command-based checks

- Ran the client production build (`npm run build`) during development; it completed successfully after fixing the JSX nesting error.
- Prior implementation notes record backend syntax checks and a focused mocked version-history query/workflow check. These are not checked-in, repeatable test suites.
- Inspected frontend/backend package scripts and searched for test files. No automated test framework or `test` script is present.

### Source/configuration checks

- Checked the actual Express route registrations and mount prefix before documenting endpoints.
- Checked the active server Release model and controller/service use before documenting stored fields and workflow behavior.
- Checked the Axios `baseURL`, backend environment reads, package scripts, and tracked deployment files.
- During this documentation update, Markdown content was aligned to those sources; the root `.env.example` contains variable names and safe placeholders only.

### Manual oversight and limits

- User review/edit/approval is an implemented product workflow; it is not evidence that every possible release sequence was manually exercised in a live deployment.
- The available development record includes mocked workflow/query checks and UI/source inspections. It does not establish a complete live browser-to-MongoDB/Gemini evaluation run, nor a verified deployed URL.
- AI-generated summaries and claims should be reviewed by a person before approval.

## 8. Human Oversight

The coding agent was used to accelerate changes, not as an authority on correctness. Its work was checked against the active implementation and build output. The application's release workflow preserves a separate human review record: users can edit generated summaries, save those edits, and explicitly approve or reject a release. The AI analysis service is prompted not to make approval decisions. Generated facts and evidence still require human scrutiny; prompt constraints do not guarantee correctness.
