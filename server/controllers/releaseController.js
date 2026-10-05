import mongoose from "mongoose";
import Release from "../models/Release.js";
import { validateReleasePackage } from "../services/validationService.js";
import { analyzeRelease as aiAnalyzeRelease } from "../services/aiService.js";

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