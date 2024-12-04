import express from "express";

import {
  signUp,
  updateProfile,
  getProfile,
  getAppliedJobs,
  applyJob,
  getAllJobs,
  generatePdf,
  generateQuiz,
  getReminderMeetings,
  logout,
  getRoomIds,
} from "../controllers/candidate.js";
import { isAuthenticatedCandidate } from "../middlewares/auth.js";
import { multiUpload } from "../middlewares/multer.js";
import { isAlreadyEmailExists } from "../middlewares/email.js";

const router = express.Router();

router.post("/signup", isAlreadyEmailExists, signUp);
router.put("/update", isAuthenticatedCandidate, multiUpload, updateProfile);
router.get("/profile", isAuthenticatedCandidate, getProfile);
router.get("/applied-jobs", isAuthenticatedCandidate, getAppliedJobs);
router.get("/all-jobs", getAllJobs);
router.post("/apply-job/:jobId", isAuthenticatedCandidate, applyJob);
router.get("/reminder-meetings", isAuthenticatedCandidate, getReminderMeetings);
router.post("/generate-pdf", isAuthenticatedCandidate, generatePdf);
router.post("/generate-quiz", isAuthenticatedCandidate, generateQuiz);
router.get("/get-rooms", isAuthenticatedCandidate, getRoomIds)
router.get("/logout", isAuthenticatedCandidate, logout);


export default router;
