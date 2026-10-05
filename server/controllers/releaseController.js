import mongoose from "mongoose";
import Release from "../models/Release.js";
import { validateReleasePackage } from "../services/validationService.js";
import { analyzeRelease as aiAnalyzeRelease } from "../services/aiService.js";
import diffService from "../services/diffService.js";

export const getHealth = (req, res) => {
  res.json({
    success: true,
    message: "Release Brief Assistant API is running",
  });
};

export const getReleases = (req, res) => {
  res.json({ message: "Get releases placeholder" });
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

    // Create release with version 1 and status draft
    const release = new Release({
      releaseId: releaseData.releaseId || `release-${Date.now()}`,
      version: releaseData.version || "1",
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
    const { version } = req.body;

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

    // NEW: Check whether a Release already exists with the same series + version
    const existingVersion = await Release.findOne({
      releaseSeriesId: sourceRelease.releaseSeriesId || sourceRelease.releaseId,
      version,
    });

    if (existingVersion) {
      return res.status(409).json({
        success: false,
        message: `Version ${version} already exists in this release series.`,
      });
    }

    // New release gets a fresh ID
    const newReleaseId = `release-${Date.now()}`;

    // Inherit series: if source has releaseSeriesId, use it;
    // otherwise use source's own releaseId (makes it the series founder)
    const releaseSeriesId = sourceRelease.releaseSeriesId || sourceRelease.releaseId;

    const newRelease = new Release({
      releaseId: newReleaseId,
      version,
      releaseSeriesId,
      previousReleaseId: sourceRelease.releaseId,
      title: sourceRelease.title || "",
      package: {
        completedFeatures: [...sourceRelease.package.completedFeatures],
        bugFixes: [...sourceRelease.package.bugFixes],
        changedBehaviour: [...sourceRelease.package.changedBehaviour],
        qaSummary: sourceRelease.package.qaSummary,
        knownLimitations: [...sourceRelease.package.knownLimitations],
        migrationNotes: [...sourceRelease.package.migrationNotes],
        affectedUserGroups: [...sourceRelease.package.affectedUserGroups],
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

    res.json({
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
    const versions = await Release.find({
      $or: [
        { releaseSeriesId: seriesId },
        { releaseId: seriesId },
      ],
    })
      .sort({ createdAt: -1 })
      .select("releaseId version title status createdAt updatedAt previousReleaseId");

    res.json({
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
 * Compare two releases.
 * GET /api/releases/compare/:releaseId1/:releaseId2
 */
export const compareReleases = async (req, res) => {
  try {
    const { releaseId1, releaseId2 } = req.params;

    const release1 = await Release.findOne({ releaseId: releaseId1 });
    const release2 = await Release.findOne({ releaseId: releaseId2 });

    if (!release1 || !release2) {
      return res.status(404).json({
        success: false,
        message: "One or both releases not found",
      });
    }

    const comparison = diffService.compareReleases(release1, release2);

    res.json({
      success: true,
      comparison,
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