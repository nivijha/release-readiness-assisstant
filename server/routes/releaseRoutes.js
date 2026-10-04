import { Router } from "express";
import {
  getHealth,
  getReleases,
  validateRelease,
  createRelease,
  handleAnalyzeRelease,
} from "../controllers/releaseController.js";

const router = Router();

router.get("/health", getHealth);
router.get("/", getReleases);
router.post("/validate", validateRelease);
router.post("/", createRelease);
router.post("/analyze", handleAnalyzeRelease);

export default router;