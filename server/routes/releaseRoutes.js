import { Router } from "express";
import {
  getHealth,
  getReleases,
  validateRelease,
  createRelease,
  handleAnalyzeRelease,
  saveReview,
  approveRelease,
  rejectRelease,
  createNewVersion,
  getReleaseVersions,
  compareReleases,
} from "../controllers/releaseController.js";

const router = Router();

router.get("/health", getHealth);
router.get("/", getReleases);
router.post("/validate", validateRelease);
router.post("/", createRelease);
router.post("/analyze", handleAnalyzeRelease);
router.put("/:releaseId/review", saveReview);
router.post("/:releaseId/approve", approveRelease);
router.post("/:releaseId/reject", rejectRelease);
router.post("/:releaseId/versions", createNewVersion);
router.get("/:releaseId/versions", getReleaseVersions);
router.get("/:releaseId1/:releaseId2", compareReleases);

export default router;