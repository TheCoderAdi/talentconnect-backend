import { Interviewer } from "../model/interviwer.js";
import { Job } from "../model/job.js";
import { Candidate } from "../model/candidate.js";
import { Application } from "../model/application.js";
import { Room } from "../model/room.js";

import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import crypto from "crypto";

import { asyncError } from "../middlewares/error.js";
import errorHandler from "../utils/error.js";
import { cookieOptions, sendMail, sendToken } from "../utils/helper.js";

export const singUp = asyncError(async (req, res, next) => {
  const { name, password, companyName, companyEmail, domainOfRecruitment } =
    req.body;

  let hashedPassword = await bcrypt.hash(password, 12);
  let verifyToken = crypto.randomBytes(32).toString("hex");
  let verifyTokenExpire = Date.now() + 10 * 60 * 1000;

  let interviwer = await Interviewer.create({
    name,
    password: hashedPassword,
    companyName,
    companyEmail,
    domainOfRecruitment,
    verifyToken,
    verifyTokenExpire
  });

  const htmlFilePath = path.join(process.cwd(), "html", "sendLink.html");

  let htmlContent = fs.readFileSync(htmlFilePath, "utf-8");

  htmlContent = htmlContent.replace(
    /{{link}}/g,
    `${process.env.BACKEND_URL}/interviewer/verify/${verifyToken}`
  );

  sendMail(companyEmail, "Verify your email", htmlContent);

  sendToken(
    interviwer,
    res,
    "Verification link has been sent to your email",
    201
  );
});

export const verifyEmail = asyncError(async (req, res, next) => {
  const { verifyToken } = req.params;

  const interviewer = await Interviewer.findOne({ verifyToken });

  if (!interviewer) return next(new errorHandler("Invalid token", 400));

  if (interviewer.verfied)
    return next(new errorHandler("Email already verified", 400));

  const tokenExpiryTime = new Date(interviewer.verifyTokenExpire);
  const currentTime = new Date(Date.now());

  if (tokenExpiryTime < currentTime)
    return next(new errorHandler("Token expired", 400));

  interviewer.verifyToken = null;
  interviewer.verfied = true;
  interviewer.verifyTokenExpire = null;

  await interviewer.save();

  res.redirect(`${process.env.CLIENT_URL}/`);
});

export const generateToken = asyncError(async (req, res, next) => {
  let interviewer = await Interviewer.findById(req.interviewer.id);

  if (!interviewer) return next(new errorHandler("Interviewer not found", 404));

  if (interviewer.verfied)
    return next(new errorHandler("Email already verified", 400));

  let verifyToken = crypto.randomBytes(32).toString("hex");
  interviewer.verifyToken = verifyToken;
  interviewer.verifyTokenExpire = Date.now() + 10 * 60 * 1000;

  await interviewer.save();

  const htmlFilePath = path.join(process.cwd(), "html", "sendLink.html");

  let htmlContent = fs.readFileSync(htmlFilePath, "utf-8");

  htmlContent = htmlContent.replace(
    /{{link}}/g,
    `${process.env.BACKEND_URL}/interviewer/verify/${verifyToken}`
  );

  sendMail(interviewer.companyEmail, "Verify your email", htmlContent);

  res.status(200).json({
    success: true,
    message: "Verification link has been sent to your email",
  });
});

export const logout = asyncError(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now() + 10 * 1000),
    ...cookieOptions,
  });

  res.status(200).json({
    success: true,
    message: "Logged out",
  });
});

export const updateProfile = asyncError(async (req, res, next) => {
  const interviewer = await Interviewer.findById(req.interviewer.id);

  if (!interviewer) {
    return next(new errorHandler("Interviewer not found", 404));
  }

  const { domainOfRecruitment, companyName, companyEmail } = req.body;

  if (domainOfRecruitment) {
    if (domainOfRecruitment.length == 0)
      interviewer.domainOfRecruitment = domainOfRecruitment;
    else {
      let filterSkills = domainOfRecruitment.filter(skill => !interviewer.domainOfRecruitment.includes(skill))
      if (filterSkills.length > 0)
        interviewer.domainOfRecruitment = filterSkills
    }
  }

  if (companyName || companyEmail) {
    interviewer.companyName = companyName;
    interviewer.verfied = false;

    interviewer.companyEmail = companyEmail;
    let verifyToken = crypto.randomBytes(32).toString("hex");
    interviewer.verifyToken = verifyToken;
    interviewer.verifyTokenExpire = Date.now() + 10 * 60 * 1000;

    await interviewer.save();

    const htmlFilePath = path.join(process.cwd(), "html", "sendLink.html");

    let htmlContent = fs.readFileSync(htmlFilePath, "utf-8");

    htmlContent = htmlContent.replace(
      /{{link}}/g,
      `${process.env.BACKEND_URL}/interviewer/verify/${verifyToken}`
    );

    sendMail(
      interviewer.companyEmail,
      "Verify your email",
      htmlContent
    )


    return res.status(200).json({
      success: true,
      message: "Please verify your new email.",
      user: interviewer
    });

  }

  await interviewer.save();

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user: interviewer,
  });
});
export const postJob = asyncError(async (req, res, next) => {
  const interviewer = await Interviewer.findById(req.interviewer.id);

  const {
    title,
    description,
    startDate,
    endDate,
    yearsOfExperience,
    location,
    areaOfStudy,
    category,
  } = req.body;

  if (!interviewer) return next(new errorHandler("Interviewer not found", 404));
  if (!interviewer.verfied)
    return next(new errorHandler("Email not verified", 400));
  let areas =
    areaOfStudy.length === 1 ? areaOfStudy[0] :
      areaOfStudy.split(",");
  const job = await Job.create({
    title,
    description,
    startDate,
    endDate,
    yearsOfExperience,
    location,
    areaOfStudy: areas,
    category,
    createdBy: interviewer._id,
    companyName: interviewer.companyName,
  });

  interviewer.jobs.push(job._id);

  await interviewer.save();

  res.status(200).json({
    success: true,
    message: "Job posted successfully",
    user: interviewer,
  });
});

export const getJobs = asyncError(async (req, res, next) => {
  const { title, location, category } = req.query;

  let filter = {};

  if (title) {
    filter.title = { $regex: title, $options: "i" };
  }

  if (location) {
    filter.location = { $regex: location, $options: "i" };
  }

  if (category) {
    filter.category = { $regex: category, $options: "i" };
  }

  const interviewer = await Interviewer.findById(req.interviewer.id).populate({
    path: "jobs",
    match: filter,
  });


  if (!interviewer) return next(new errorHandler("Interviewer not found", 404));

  res.status(200).json({
    success: true,
    data: interviewer.jobs,
  });
});

export const getApplicants = asyncError(async (req, res, next) => {
  const interviewer = await Interviewer.findById(req.interviewer.id).populate({
    path: "jobs",
    populate: {
      path: "applications",
      select: "user",
    },
  });

  if (!interviewer) return next(new errorHandler("Interviewer not found", 404));

  let applicants = [];

  interviewer.jobs.forEach((job) => {
    job.applications.forEach((application) => {
      applicants.push(application);
    });
  });

  res.status(200).json({
    success: true,
    data: applicants,
  });
});

export const getJob = asyncError(async (req, res, next) => {
  const { jobId } = req.params;

  const job = await Job.findById(jobId);

  if (!job) return next(new errorHandler("Job not found", 404));

  res.status(200).json({
    success: true,
    data: job,
  });
});

export const updateJob = asyncError(async (req, res, next) => {
  const { jobId } = req.params;

  const job = await Job.findById(jobId);

  if (!job) return next(new errorHandler("Job not found", 404));

  const { status } = req.body;

  job.status = status;

  await job.save();

  res.status(200).json({
    success: true,
    message: "Job updated successfully",
  });
});

export const deleteJob = asyncError(async (req, res, next) => {
  const { jobId } = req.params;

  const job = await Job.findById(jobId).populate("applications");
  if (!job) return next(new errorHandler("Job not found", 404));

  const interviewer = await Interviewer.findById(req.interviewer.id);
  if (!interviewer) return next(new errorHandler("Interviewer not found", 404));

  interviewer.jobs = interviewer.jobs.filter((job) => job.toString() !== jobId);
  await interviewer.save();

  for (const application of job.applications) {
    const candidate = await Candidate.findById(application.candidate);
    if (candidate) {
      candidate.appliedJobs = candidate.appliedJobs.filter(
        (appliedJob) => appliedJob.toString() !== jobId
      );
      await candidate.save();
    }
  }

  await Application.deleteMany({ job: jobId });

  await Job.findByIdAndDelete(jobId);

  res.status(200).json({
    success: true,
    message: "Job deleted successfully",
  });
});

export const getProfile = asyncError(async (req, res, next) => {
  const interviewer = await Interviewer.findById(req.interviewer.id);

  if (!interviewer) return next(new errorHandler("Interviewer not found", 404));

  res.status(200).json({
    success: true,
    data: interviewer,
  });
});

const updateCandidateStatus = async (jobId, candidateId, status, next) => {
  const job = await Job.findById(jobId).populate("applications");

  if (!job) return next(new errorHandler("Job not found", 404));

  const application = job.applications.find(
    (app) => app.candidate.toString() === candidateId
  );

  if (!application) return next(new errorHandler("Application not found", 404));

  const updatedApplication = await Application.findByIdAndUpdate(
    application._id,
    { status },
    { new: true }
  );

  if (!updatedApplication)
    return next(new errorHandler("Failed to update application status", 500));

  return updatedApplication;
};

export const approveCandidate = asyncError(async (req, res, next) => {
  const { jobId, candidateId } = req.params;

  await updateCandidateStatus(jobId, candidateId, "accepted", next);

  await Room.create({
    roomId: crypto.randomBytes(8).toString("hex"),
    interviewerId: req.interviewer.id,
    jobId,
    candidateId
  });

  res.status(200).json({
    success: true,
    message: "Candidate approved successfully",
  });
});

export const rejectCandidate = asyncError(async (req, res, next) => {
  const { jobId, candidateId } = req.params;

  await updateCandidateStatus(jobId, candidateId, "rejected", next);

  res.status(200).json({
    success: true,
    message: "Candidate rejected successfully",
  });
});

export const getApplications = asyncError(async (req, res, next) => {
  const { jobId } = req.params;

  const job = await Job.findById(jobId).populate({
    path: "applications",
    populate: {
      path: "candidate"
    }
  });

  if (!job) return next(new errorHandler("Job not found", 404));

  res.status(200).json({
    success: true,
    data: job.applications,
  });
});

export const getRoomIds = asyncError(async (req, res, next) => {
  const rooms = await Room.find({ interviewerId: req.interviewer.id });

  if (!rooms) return next(new errorHandler("Rooms not found", 404));

  const datas = rooms.map(room => {
    return {
      roomId: room.roomId,
      jobId: room.jobId,
    }
  });

  return res.status(200).json({
    success: true,
    data: datas,
  });
});