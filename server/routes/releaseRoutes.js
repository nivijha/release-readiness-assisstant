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

export default router;