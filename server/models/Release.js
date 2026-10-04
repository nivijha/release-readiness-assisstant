import mongoose from "mongoose";

const impactAnalysisSchema = new mongoose.Schema(
  {
    item: String,
    source: String,
    impact: String,
    affectedUsers: String,
    reason: String,
    evidence: [String],
  },
  { _id: false }
);

const missingInformationSchema = new mongoose.Schema(
  {
    item: String,
    reason: String,
  },
  { _id: false }
);

const unsupportedClaimSchema = new mongoose.Schema(
  {
    claim: String,
    reason: String,
    qaEvidence: String,
  },
  { _id: false }
);

const riskSchema = new mongoose.Schema(
  {
    risk: String,
    severity: String,
    source: String,
    reason: String,
  },
  { _id: false }
);

const summarySchema = new mongoose.Schema(
  {
    text: String,
    evidence: [String],
  },
  { _id: false }
);

const releaseSchema = new mongoose.Schema(
  {
    releaseId: {
      type: String,
      required: true,
      unique: true,
    },
    version: {
      type: String,
      required: true,
    },
    package: {
      completedFeatures: [{ type: String }],
      bugFixes: [{ type: String }],
      changedBehaviour: [{ type: String }],
      qaSummary: { type: String },
      knownLimitations: [{ type: String }],
      migrationNotes: [{ type: String }],
      affectedUserGroups: [{ type: String }],
    },
    generatedBrief: {
      internalSummary: { type: String },
      stakeholderSummary: { type: String },
    },
    analysis: {
      impactAnalysis: [impactAnalysisSchema],
      missingInformation: [missingInformationSchema],
      unsupportedClaims: [unsupportedClaimSchema],
      risks: [riskSchema],
      internalSummary: summarySchema,
      stakeholderSummary: summarySchema,
    },
    status: {
      type: String,
      enum: ["draft", "approved", "rejected"],
      default: "draft",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Release = mongoose.model("Release", releaseSchema);

export default Release;