import mongoose from "mongoose";
import Release from "../models/Release.js";
import { validateReleasePackage } from "../services/validationService.js";
import { analyzeRelease as aiAnalyzeRelease } from "../services/aiService.js";
import diffService from "../services/diffService.js";

const packageListFields = [
  "completedFeatures",
  "bugFixes",
  "changedBehaviour",
  "knownLimitations",
  "migrationNotes",
  "affectedUserGroups",
];

const normalizeVersion = (version) =>
  String(version || "").trim().replace(/^v/i, "");

const getNextMinorVersion = (version, existingVersions) => {
  const match = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(String(version || ""));
  if (!match) return null;

  const prefix = String(version).startsWith("v") ? "v" : "";
  const major = Number(match[1]);
  let minor = Number(match[2]) + 1;
  const existing = new Set(existingVersions.map(normalizeVersion));
  let nextVersion = `${prefix}${major}.${minor}.0`;

  while (existing.has(normalizeVersion(nextVersion))) {
    minor += 1;
    nextVersion = `${prefix}${major}.${minor}.0`;
  }

  return nextVersion;
};

const uniqueVersions = (releases, preferredReleaseId) => {
  const byVersion = new Map();

  for (const release of releases) {
    const key = normalizeVersion(release.version);
    const current = byVersion.get(key);
    const candidateIsPreferred = release.releaseId === preferredReleaseId;
    const currentIsPreferred = current?.releaseId === preferredReleaseId;
    const candidateIsApproved = release.status === "approved";
    const currentIsApproved = current?.status === "approved";
    const candidateIsNewer =
      new Date(release.updatedAt || release.createdAt || 0).getTime() >
      new Date(current?.updatedAt || current?.createdAt || 0).getTime();

    if (
      !current ||
      (candidateIsPreferred && !currentIsPreferred) ||
      (candidateIsPreferred === currentIsPreferred &&
        candidateIsApproved &&
        !currentIsApproved) ||
      (candidateIsPreferred === currentIsPreferred &&
        candidateIsApproved === currentIsApproved &&
        candidateIsNewer)
    ) {
      byVersion.set(key, release);
    }
  }

  return [...byVersion.values()].sort(
    (left, right) =>
      new Date(right.createdAt || right.updatedAt || 0).getTime() -
      new Date(left.createdAt || left.updatedAt || 0).getTime()
  );
};

export const getHealth = (req, res) => {
  res.json({
    success: true,
    message: "Release Brief Assistant API is running",
  });
};

export const getReleases = async (req, res) => {
  try {
    const releases = await Release.find({})
      .sort({ createdAt: -1 })
      .select("releaseId version title status createdAt updatedAt previousReleaseId");
    return res.json({ success: true, releases });
  } catch (error) {
    console.error("Get releases error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to get releases",
    });
  }
};

/**
 * Get a release by its stable release ID.
 * GET /api/releases/:releaseId
 */
export const getRelease = async (req, res) => {
  try {
    const release = await Release.findOne({ releaseId: req.params.releaseId });
    if (!release) {
      return res.status(404).json({
        success: false,
        message: "Release not found",
      });
    }
    return res.json({ success: true, release });
  } catch (error) {
    console.error("Get release error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to get release",
    });
  }
};

/**
 * Update a draft release package.
 * PUT /api/releases/:releaseId
 */
export const updateDraftRelease = async (req, res) => {
  try {
    const release = await Release.findOne({ releaseId: req.params.releaseId });
    if (!release) {
      return res.status(404).json({
        success: false,
        message: "Release not found",
      });
    }
    if (release.status !== "draft") {
      return res.status(400).json({
        success: false,
        message: "Only draft releases can be updated",
      });
    }

    const data = req.body || {};
    release.title = typeof data.title === "string" ? data.title : release.title;
    release.package = release.package || {};
    for (const field of packageListFields) {
      if (typeof data[field] === "string") {
        release.package[field] = data[field]
          .split(/\r?\n/)
          .map((value) => value.trim())
          .filter(Boolean);
      } else if (Array.isArray(data[field])) {
        release.package[field] = data[field];
      }
    }
    if (typeof data.qaSummary === "string") {
      release.package.qaSummary = data.qaSummary;
    }

    release.analysis = {
      impactAnalysis: [],
      missingInformation: [],
      unsupportedClaims: [],
      risks: [],
      internalSummary: { text: "", evidence: [] },
      stakeholderSummary: { text: "", evidence: [] },
    };
    release.review = {
      internalSummary: "",
      stakeholderSummary: "",
      reviewedAt: null,
      approvedAt: null,
      rejectionReason: "",
    };
    await release.save();

    const savedPackage =
      typeof release.package?.toObject === "function"
        ? release.package.toObject()
        : release.package;
    return res.json({
      success: true,
      release,
      validation: validateReleasePackage({
        ...savedPackage,
        ...Object.fromEntries(
          packageListFields.map((field) => [
            field,
            Array.isArray(savedPackage?.[field])
              ? savedPackage[field].join("\n")
              : "",
          ])
        ),
      }),
    });
  } catch (error) {
    console.error("Update draft release error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update draft release",
    });
  }
};

export const validateRelease = async (req, res) => {
  try {
    const releaseData = req.body;

    const validation = validateReleasePackage(releaseData);

    res.json({
      success: true,
      validation,
    });
  } catch (error) {
    console.error("Validation error:", error.message);
    res.status(400).json({
      success: false,
      message: "Please provide the required release information",
    });
  }
};

export const createRelease = async (req, res) => {
  try {
    const releaseData = req.body;

    // Validate required fields first
    const validation = validateReleasePackage(releaseData);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Release package is missing required fields",
        validation,
      });
    }

    // Check if MongoDB is connected
    if (!mongoose.connection.readyState) {
      return res.status(500).json({
        success: false,
        message: "Database connection is unavailable",
      });
    }

    const releaseId =
      releaseData.releaseId || `release-${new mongoose.Types.ObjectId()}`;

    // The first release anchors the series; future versions inherit this ID.
    const release = new Release({
      releaseId,
      version: releaseData.version || "1",
      releaseSeriesId: releaseId,
      package: {
        completedFeatures: releaseData.completedFeatures,
        bugFixes: releaseData.bugFixes,
        changedBehaviour: releaseData.changedBehaviour,
        qaSummary: releaseData.qaSummary,
        knownLimitations: releaseData.knownLimitations,
        migrationNotes: releaseData.migrationNotes,
        affectedUserGroups: releaseData.affectedUserGroups,
      },
      generatedBrief: {
        internalSummary: "",
        stakeholderSummary: "",
      },
      analysis: {
        impactAnalysis: [],
        missingInformation: [],
        unsupportedClaims: [],
        risks: [],
        internalSummary: {
          text: "",
          evidence: [],
        },
        stakeholderSummary: {
          text: "",
          evidence: [],
        },
      },
      status: "draft",
    });

    await release.save();

    res.status(201).json({
      success: true,
      release,
    });
  } catch (error) {
    console.error("Create release error:", error.message);

    if (!mongoose.connection.readyState) {
      res.status(500).json({
        success: false,
        message: "Release could not be saved because the database is unavailable",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Release validation failed",
        error: error.message,
      });
    }
  }
};

/**
 * Save user-reviewed summaries for a release.
 * PUT /api/releases/:releaseId/review
 */
export const saveReview = async (req, res) => {
  try {
    const { releaseId } = req.params;
    const { internalSummary, stakeholderSummary } = req.body;

    if (
      typeof internalSummary !== "string" ||
      !internalSummary.trim() ||
      typeof stakeholderSummary !== "string" ||
      !stakeholderSummary.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Both reviewed summaries are required",
      });
    }

    const release = await Release.findOne({ releaseId });
    if (!release) {
      return res.status(404).json({
        success: false,
        message: "Release not found",
      });
    }

    // Update reviewed summaries, preserving original AI analysis
    release.review.internalSummary = internalSummary;
    release.review.stakeholderSummary = stakeholderSummary;
    release.review.reviewedAt = new Date();
    await release.save();

    res.json({
      success: true,
      release,
    });
  } catch (error) {
    console.error("Save review error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to save review",
    });
  }
};

/**
 * Approve a release.
 * POST /api/releases/:releaseId/approve
 */
export const approveRelease = async (req, res) => {
  try {
    const { releaseId } = req.params;

    const release = await Release.findOne({ releaseId });
    if (!release) {
      return res.status(404).json({
        success: false,
        message: "Release not found",
      });
    }

    const hasAnalysis =
      release.analysis &&
      Array.isArray(release.analysis.impactAnalysis) &&
      Array.isArray(release.analysis.missingInformation) &&
      Array.isArray(release.analysis.unsupportedClaims) &&
      Array.isArray(release.analysis.risks) &&
      typeof release.analysis.internalSummary?.text === "string" &&
      release.analysis.internalSummary.text.trim() &&
      typeof release.analysis.stakeholderSummary?.text === "string" &&
      release.analysis.stakeholderSummary.text.trim();
    const hasSavedReview =
      release.review?.reviewedAt &&
      typeof release.review.internalSummary === "string" &&
      release.review.internalSummary.trim() &&
      typeof release.review.stakeholderSummary === "string" &&
      release.review.stakeholderSummary.trim();

    console.info("Approve release readiness:", {
      releaseId,
      hasAnalysis: Boolean(hasAnalysis),
      hasReview: Boolean(hasSavedReview),
      status: release.status,
    });

    if (!hasAnalysis) {
      return res.status(400).json({
        success: false,
        message: "Analysis data is missing. Cannot approve without analysis.",
      });
    }

    if (!hasSavedReview) {
      return res.status(400).json({
        success: false,
        message: "Saved review summaries are required before approval.",
      });
    }

    // Set status and approval timestamp
    release.status = "approved";
    release.review.approvedAt = new Date();
    await release.save();

    res.json({
      success: true,
      release,
    });
  } catch (error) {
    console.error("Approve release error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to approve release",
    });
  }
};

/**
 * Reject a release.
 * POST /api/releases/:releaseId/reject
 */
export const rejectRelease = async (req, res) => {
  try {
    const { releaseId } = req.params;
    const { reason } = req.body;

    const release = await Release.findOne({ releaseId });
    if (!release) {
      return res.status(404).json({
        success: false,
        message: "Release not found",
      });
    }

    const hasAnalysis =
      release.analysis &&
      Array.isArray(release.analysis.impactAnalysis) &&
      Array.isArray(release.analysis.missingInformation) &&
      Array.isArray(release.analysis.unsupportedClaims) &&
      Array.isArray(release.analysis.risks) &&
      typeof release.analysis.internalSummary?.text === "string" &&
      release.analysis.internalSummary.text.trim() &&
      typeof release.analysis.stakeholderSummary?.text === "string" &&
      release.analysis.stakeholderSummary.text.trim();
    const hasSavedReview =
      release.review?.reviewedAt &&
      typeof release.review.internalSummary === "string" &&
      release.review.internalSummary.trim() &&
      typeof release.review.stakeholderSummary === "string" &&
      release.review.stakeholderSummary.trim();

    console.info("Reject release readiness:", {
      releaseId,
      hasAnalysis: Boolean(hasAnalysis),
      hasReview: Boolean(hasSavedReview),
      status: release.status,
    });

    if (!hasAnalysis || !hasSavedReview) {
      return res.status(400).json({
        success: false,
        message: "Analysis and saved review summaries are required before rejection.",
      });
    }

    // Set status and rejection information
    release.status = "rejected";
release.review.rejectionReason =
      typeof reason === "string" && reason.trim()
        ? reason.trim()
        : "No reason provided.";
    await release.save();

    res.json({
      success: true,
      release,
    });
  } catch (error) {
    console.error("Reject release error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to reject release",
    });
  }
};

/**
 * Create a new version from an existing release.
 * POST /api/releases/:releaseId/versions
 *
 * The new version:
 * - receives a new releaseId
 * - inherits the releaseSeriesId (or source's releaseId if first)
 * - sets previousReleaseId to the source releaseId
 * - copies the release package as the starting point
 * - resets status to "draft"
 * - resets review (no saved summaries, no approval/rejection)
 * - resets analysis (empty, must be analyzed again)
 * - has new createdAt/updatedAt
 * - does NOT modify the original release
 */
export const createNewVersion = async (req, res) => {
  try {
    const { releaseId } = req.params;

    const sourceRelease = await Release.findOne({ releaseId });
    if (!sourceRelease) {
      return res.status(404).json({
        success: false,
        message: "Release not found",
      });
    }

    // NEW: A new version can only be created from an approved release
    if (sourceRelease.status !== "approved") {
      return res.status(400).json({
        success: false,
        message:
          "A new version can only be created from an approved release.",
      });
    }

    const releaseSeriesId = sourceRelease.releaseSeriesId || sourceRelease.releaseId;
    const seriesReleases = await Release.find({
      $or: [
        { releaseSeriesId },
        { releaseId: releaseSeriesId },
      ],
    });
    const version = getNextMinorVersion(
      sourceRelease.version,
      seriesReleases.map((release) => release.version)
    );
    if (!version) {
      return res.status(400).json({
        success: false,
        message: "Release version must use the format vX.Y.Z to create a new version.",
      });
    }

    const sourcePackage = sourceRelease.package || {};
    const newRelease = new Release({
      releaseId: `release-${new mongoose.Types.ObjectId().toString()}`,
      version,
      releaseSeriesId,
      previousReleaseId: sourceRelease.releaseId,
      title: sourceRelease.title || "",
      package: {
        completedFeatures: [...(sourcePackage.completedFeatures || [])],
        bugFixes: [...(sourcePackage.bugFixes || [])],
        changedBehaviour: [...(sourcePackage.changedBehaviour || [])],
        qaSummary: sourcePackage.qaSummary || "",
        knownLimitations: [...(sourcePackage.knownLimitations || [])],
        migrationNotes: [...(sourcePackage.migrationNotes || [])],
        affectedUserGroups: [...(sourcePackage.affectedUserGroups || [])],
      },
      generatedBrief: {
        internalSummary: "",
        stakeholderSummary: "",
      },
      analysis: {
        impactAnalysis: [],
        missingInformation: [],
        unsupportedClaims: [],
        risks: [],
        internalSummary: { text: "", evidence: [] },
        stakeholderSummary: { text: "", evidence: [] },
      },
      status: "draft",
      review: {
        internalSummary: "",
        stakeholderSummary: "",
        reviewedAt: null,
        approvedAt: null,
        rejectionReason: "",
      },
    });

    await newRelease.save();

    return res.json({
      success: true,
      release: newRelease,
    });
  } catch (error) {
    console.error("Create new version error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create new version",
    });
  }
};

/**
 * Get all versions belonging to the same release series.
 * GET /api/releases/:releaseId/versions
 */
export const getReleaseVersions = async (req, res) => {
  try {
    const { releaseId } = req.params;

    const sourceRelease = await Release.findOne({ releaseId });
    if (!sourceRelease) {
      return res.status(404).json({
        success: false,
        message: "Release not found",
      });
    }

    // Resolve the series ID:
    // - If sourceRelease has releaseSeriesId, use it
    // - Otherwise, the source release itself is the founder, so use its releaseId
    const seriesId = sourceRelease.releaseSeriesId || sourceRelease.releaseId;

    // Find all releases in the same series, supporting BOTH:
    // 1. Modern releases with releaseSeriesId explicitly set
    // 2. The original/founder release whose releaseSeriesId is missing
    //    but whose releaseId === seriesId
    const releases = await Release.find({
      $or: [
        { releaseSeriesId: seriesId },
        { releaseId: seriesId },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("releaseId version title status createdAt updatedAt previousReleaseId");
    const versions = uniqueVersions(releases, sourceRelease.releaseId);

    return res.json({
      success: true,
      versions,
    });
  } catch (error) {
    console.error("Get release versions error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to get release versions",
    });
  }
};

/**
 * Detect package sections that changed since the previous release.
 * GET /api/releases/:releaseId/stale-statements
 */
export const getStaleStatements = async (req, res) => {
  try {
    const { releaseId } = req.params;
    const currentRelease = await Release.findOne({ releaseId });

    if (!currentRelease) {
      return res.status(404).json({
        success: false,
        message: "Release not found",
      });
    }

    if (!currentRelease.previousReleaseId) {
      return res.json({
        success: true,
        staleStatements: [],
      });
    }

    const previousRelease = await Release.findOne({
      releaseId: currentRelease.previousReleaseId,
    });
    if (!previousRelease) {
      return res.status(404).json({
        success: false,
        message: "Previous release not found",
      });
    }

    const reason =
      "The corresponding release section changed and the previous statement may no longer be valid.";
    const staleStatements = diffService
      .compareReleases(previousRelease, currentRelease)
      .filter((section) => section.changed)
      .map((section) => ({
        section: section.field,
        previousVersion: previousRelease.version,
        previousStatement: section.oldValue,
        currentVersion: currentRelease.version,
        currentStatement: section.newValue,
        reason,
      }));

    return res.json({
      success: true,
      staleStatements,
    });
  } catch (error) {
    console.error("Get stale statements error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to detect stale statements",
    });
  }
};

/**
 * Compare two releases.
 * GET /api/releases/compare/:releaseId1/:releaseId2
 */
export const compareReleases = async (req, res) => {
  try {
    const { releaseId1, releaseId2 } = req.params;

    const [release1, release2] = await Promise.all([
      Release.findOne({ releaseId: releaseId1 }),
      Release.findOne({ releaseId: releaseId2 }),
    ]);

    if (!release1 || !release2) {
      return res.status(404).json({
        success: false,
        message: "One or both releases not found",
      });
    }
    if (
      normalizeVersion(release1.version) === normalizeVersion(release2.version)
    ) {
      return res.status(400).json({
        success: false,
        message: "Choose two different release versions to compare",
      });
    }

    const releaseSeriesId1 = release1.releaseSeriesId || release1.releaseId;
    const releaseSeriesId2 = release2.releaseSeriesId || release2.releaseId;
    if (releaseSeriesId1 !== releaseSeriesId2) {
      return res.status(400).json({
        success: false,
        message: "Releases must belong to the same version series",
      });
    }

    res.json({
      success: true,
      comparison: {
        oldVersion: release1.version,
        newVersion: release2.version,
        sections: diffService.compareReleases(release1, release2),
      },
    });
  } catch (error) {
    console.error("Compare releases error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to compare releases",
    });
  }
};

/**
 * HandleAnalyzeRelease - unchanged existing handler
 */
export const handleAnalyzeRelease = async (req, res) => {
  try {
    const releaseData = req.body;
    const { releaseId } = releaseData;

    if (typeof releaseId !== "string" || !releaseId.trim()) {
      return res.status(400).json({
        success: false,
        message: "Release ID is required to save analysis",
      });
    }

    const release = await Release.findOne({ releaseId });
    if (!release) {
      return res.status(404).json({
        success: false,
        message: "Release not found",
      });
    }

    // Step 1: Deterministic validation
    const validation = validateReleasePackage(releaseData);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Release package is incomplete.",
        validation,
      });
    }

    // Step 2: Call AI analysis
    let aiResult;
    try {
      aiResult = await aiAnalyzeRelease(releaseData);
    } catch (aiError) {
      console.error("AI analysis failed:", aiError.message);
      return res.status(aiError.statusCode || 502).json({
        success: false,
        message: aiError.message || "AI analysis could not be completed.",
      });
    }

    // Step 3: Validate AI response structure
    if (!aiResult || !aiResult.success) {
      return res.status(502).json({
        success: false,
        message: "AI analysis could not be completed.",
      });
    }

    const validatedAnalysis = aiResult.analysis;

    // Verify required structure
    const requiredFields = [
      "impactAnalysis",
      "missingInformation",
      "unsupportedClaims",
      "risks",
      "internalSummary",
      "stakeholderSummary",
    ];

    const missingStructuralField = requiredFields.find(
      (field) => !validatedAnalysis[field]
    );

    if (missingStructuralField) {
      return res.status(502).json({
        success: false,
        message: "AI returned an invalid analysis format.",
      });
    }

    release.analysis = validatedAnalysis;
    await release.save();

    console.info("Release analysis persisted:", {
      releaseId,
      hasAnalysis: Boolean(release.analysis?.internalSummary?.text),
      status: release.status,
    });

    res.json({
      success: true,
      analysis: validatedAnalysis,
    });
  } catch (error) {
    console.error("Analyze release error:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error during analysis",
    });
  }
};