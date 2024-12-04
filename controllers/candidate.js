import { Candidate } from "../model/candidate.js";
import { Job } from "../model/job.js";
import { Room } from "../model/room.js";
import { Application } from "../model/Application.js";

import { asyncError } from "../middlewares/error.js";
import ErrorHandler from "../utils/error.js";
import { cookieOptions, getBase64, sendToken } from "../utils/helper.js";
import { model } from "../index.js";

import bcrypt from "bcryptjs";
import cloudinary from "cloudinary";

export const signUp = asyncError(async (req, res, next) => {
  const { name, email, password } = req.body;

  let hashedPassword = await bcrypt.hash(password, 10);

  const candidate = await Candidate.create({
    name,
    email,
    password: hashedPassword,
  });

  sendToken(
    candidate,
    res,
    `Candidate ${candidate.name} registered successfully`,
    201
  );
});

export const getProfile = asyncError(async (req, res, next) => {
  const candidate = await Candidate.findById(req.candidate.id);

  if (!candidate) return next(new ErrorHandler("Candidate not found", 404));

  res.status(200).json({
    success: true,
    candidate,
  });
});

export const updateProfile = asyncError(async (req, res, next) => {
  const {
    phoneNumber,
    institutationName,
    DOB,
    skills,
    areaOfStudy,
    yearsOfExperience,
    githubLink,
    linkedinLink,
  } = req.body;

  const candidate = await Candidate.findById(req.candidate.id);
  if (candidate) {
    candidate.phoneNumber = phoneNumber;
    candidate.institutationName = institutationName;
    candidate.DOB = DOB;
    if (skills) {
      if (skills.lenght == 1) candidate.skills = skills;
      else {
        let filteredSkills = skills.split(",");
        candidate.skills = filteredSkills;
      }
    }
    candidate.areaOfStudy = areaOfStudy;
    candidate.yearsOfExperience = yearsOfExperience;
    candidate.githubLink = githubLink;
    candidate.linkedinLink = linkedinLink;

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        let uploadFile = undefined;

        if (file.originalname === "profilePic") {
          if (candidate.profilePic.public_id) {
            await cloudinary.v2.uploader.destroy(
              candidate.profilePic.public_id
            );
          }

          uploadFile = await cloudinary.v2.uploader.upload(getBase64(file), {
            folder: "talent-connect/candidates/profilePics",
          });

          candidate.profilePic = {
            public_id: uploadFile.public_id,
            url: uploadFile.secure_url,
          };
        } else if (file.originalname === "resume") {
          if (candidate.resume.public_id) {
            await cloudinary.v2.uploader.destroy(candidate.resume.public_id);
          }

          uploadFile = await cloudinary.v2.uploader.upload(getBase64(file), {
            folder: "talent-connect/candidates/resumes",
            format: "pdf",
          });

          candidate.resume = {
            public_id: uploadFile.public_id,
            url: uploadFile.secure_url,
          };
        }
      }
    }

    await candidate.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: candidate,
    });
  } else {
    return next(new ErrorHandler("Candidate not found", 404));
  }
});

export const logout = asyncError(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    ...cookieOptions,
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

export const applyJob = asyncError(async (req, res, next) => {
  const { jobId } = req.params;

  const candidate = await Candidate.findById(req.candidate.id);
  const job = await Job.findById(jobId);

  if (job.status === "closed")
    return next(new ErrorHandler("Job is closed", 400));

  const isApplied = candidate.appliedJobs.includes(jobId);

  if (isApplied) return next(new ErrorHandler("Already applied for job", 400));

  const application = await Application.create({
    candidate: req.candidate.id,
    job: jobId,
  });

  candidate.appliedJobs.push(jobId);
  job.applications.push(application._id);

  await candidate.save();
  await job.save();

  res.status(200).json({
    success: true,
    message: "Applied for job successfully",
    user: candidate
  });
});

export const getAppliedJobs = asyncError(async (req, res, next) => {
  const candidate = await Candidate.findById(req.candidate.id).populate(
    "appliedJobs"
  );

  if (!candidate) return next(new ErrorHandler("Candidate not found", 404));

  res.status(200).json({
    success: true,
    appliedJobs: candidate.appliedJobs,
  });
});

export const getAllJobs = asyncError(async (req, res, next) => {
  const { title, location, category, yearsOfExperience } = req.query;

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

  if (yearsOfExperience) {
    filter.yearsOfExperience = { $gte: Number(yearsOfExperience) };
  }
  let jobs;

  if (Object.keys(filter).length === 0) {
    jobs = await Job.find({ status: "open" }).sort({ createdAt: -1 });
  } else {
    jobs = await Job.find(filter).sort({ createdAt: -1 });
  }

  if (!jobs || jobs.length === 0) {
    return next(
      new ErrorHandler("No jobs found matching the filter criteria", 404)
    );
  }

  res.status(200).json({
    success: true,
    jobs,
  });
});

export const getReminderMeetings = asyncError(async (req, res, next) => {
  const candidate = await Candidate.findById(req.candidate.id).populate({
    path: "appliedJobs",
    populate: {
      path: "applications",
      match: { status: "accepted", candidate: req.candidate.id },
    }
  })

  if (!candidate) return next(new ErrorHandler("Candidate not found", 404));

  res.status(200).json({
    success: true,
    data: candidate.appliedJobs,
  });
});

export const generateQuiz = asyncError(async (req, res, next) => {
  const { numOfQuestion, language, difficulty } = req.body;

  if (!numOfQuestion || !language || !difficulty)
    return next(
      new ErrorHandler("Please provide all the required fields", 400)
    );
  let prompt = `You are a exam invigilator. A candidate has requested you to generate a quiz for them. The candidate has requested for a quiz with ${numOfQuestion} questions in ${language} language and of ${difficulty} difficulty level. Generate a mcq quiz for the candidate.also include the answers for the questions.`;
  const result = await model.generateContent(prompt);

  let quiz = [];
  result.response
    .text()
    .split("\n")
    .forEach((line) => {
      if (line !== "") {
        quiz.push(line);
      }
    });

  res.status(200).json({
    success: true,
    message: "Quiz generated successfully",
    data: quiz,
  });
});

export const generatePdf = asyncError(async (req, res, next) => {
  const { numOfQuestion, language, difficulty } = req.body;

  if (!numOfQuestion || !language || !difficulty)
    return next(
      new ErrorHandler("Please provide all the required fields", 400)
    );

  let prompt = `You are a working agent in the leetcode company. A candidate has requested you to generate a pdf of ${numOfQuestion} programming questions in ${language} language and of ${difficulty} difficulty level. Generate programming questions for the candidate.
  `;

  const result = await model.generateContent(prompt);

  let questions = [];

  result.response
    .text()
    .split("\n")
    .forEach((line) => {
      if (line !== "") {
        questions.push(line);
      }
    });

  res.status(200).json({
    success: true,
    message: "Pdf generated successfully",
    data: questions,
  });
});

export const getRoomIds = asyncError(async (req, res, next) => {

  const rooms = await Room.find({ candidateId: req.candidate.id });

  if (!rooms || rooms.length === 0) {
    return next(new ErrorHandler("No rooms found", 404));
  }

  const datas = rooms.map(room => {
    return {
      roomId: room.roomId,
      roomStatus: room.roomStatus,
      jobId: room.jobId
    }
  })

  res.status(200).json({
    success: true,
    data: datas,
  });
})