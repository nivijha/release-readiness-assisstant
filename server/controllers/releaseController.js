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
      version: 1,
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
    res.status(500).json({
      success: false,
      message: "Release could not be saved because the database is unavailable",
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
      return res.status(502).json({
        success: false,
        message: "AI analysis could not be completed.",
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