import mongoose from "mongoose";

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
      impactAnalysis: { type: String },
      missingInformation: [{ type: String }],
      unsupportedClaims: [{ type: String }],
      risks: [{ type: String }],
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