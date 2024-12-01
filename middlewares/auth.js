import { Candidate } from "../model/candidate.js";
import { Interviewer } from "../model/interviwer.js";

import ErrorHandler from "../utils/error.js";
import jwt from "jsonwebtoken";
import { asyncError } from "./error.js";

export const isAuthenticatedCandidate = asyncError(async (req, res, next) => {
  const { token } = req.cookies;

  if (!token)
    return next(new ErrorHandler("Login to access this resource", 401));

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  req.candidate = await Candidate.findById(decoded._id);

  if (req.candidate.role !== "candidate")
    return next(
      new ErrorHandler("Not authorized to access this resource", 401)
    );
  next();
});

export const isAuthenticatedInterviewer = asyncError(async (req, res, next) => {
  const { token } = req.cookies;
  if (!token)
    return next(new ErrorHandler("Login to access this resource", 401));

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  req.interviewer = await Interviewer.findById(decoded.id);

  if (req.interviewer.role !== "interviewer")
    return next(
      new ErrorHandler("Not authorized to access this resource", 401)
    );

  next();
});
