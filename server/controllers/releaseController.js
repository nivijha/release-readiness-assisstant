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

    // Confirm analysis exists
    if (!release.analysis || !release.analysis.internalSummary?.text) {
      return res.status(400).json({
        success: false,
        message: "Analysis data is missing. Cannot approve without analysis.",
      });
    }

    // Confirm reviewed summaries exist or use current generated summaries
    if (!release.review.internalSummary) {
      release.review.internalSummary = release.generatedBrief.internalSummary;
    }
    if (!release.review.stakeholderSummary) {
      release.review.stakeholderSummary = release.generatedBrief.stakeholderSummary;
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

    // Set status and rejection information
    release.status = "rejected";
    release.review.rejectionReason = reason;
    release.review.reviewedAt = new Date();
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