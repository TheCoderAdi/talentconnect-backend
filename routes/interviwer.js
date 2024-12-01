import express from "express";

import {
  singUp,
  verifyEmail,
  postJob,
  deleteJob,
  updateJob,
  getJob,
  getJobs,
  getApplicants,
  getProfile,
  updateProfile,
  generateToken,
  logout,
  approveCandidate,
  getApplications,
  rejectCandidate,
  getRoomIds,
} from "../controllers/interviewer.js";
import { isAuthenticatedInterviewer } from "../middlewares/auth.js";
import { isAlreadyEmailExists } from "../middlewares/email.js";

const router = express.Router();

router.post("/signup", isAlreadyEmailExists, singUp);
router.get("/verify/:verifyToken", verifyEmail);
router.post("/generate-token", isAuthenticatedInterviewer, generateToken);
router.get("/logout", isAuthenticatedInterviewer, logout);
router.post("/post-job", isAuthenticatedInterviewer, postJob);
router.delete("/delete-job/:jobId", isAuthenticatedInterviewer, deleteJob);
router.put("/update-job/:jobId", isAuthenticatedInterviewer, updateJob);
router.get("/get-job/:jobId", isAuthenticatedInterviewer, getJob);
router.get("/get-jobs", isAuthenticatedInterviewer, getJobs);
router.get("/get-applicants", isAuthenticatedInterviewer, getApplicants);
router.get("/profile", isAuthenticatedInterviewer, getProfile);
router.put("/update", isAuthenticatedInterviewer, updateProfile);
router.put(
  "/approve-candidate/:jobId/:candidateId",
  isAuthenticatedInterviewer,
  approveCandidate
);
router.put(
  "/reject-candidate/:jobId/:candidateId",
  isAuthenticatedInterviewer,
  rejectCandidate
);
router.get(
  "/get-applications/:jobId",
  isAuthenticatedInterviewer,
  getApplications
);
router.get("/get-rooms", isAuthenticatedInterviewer, getRoomIds);

export default router;
