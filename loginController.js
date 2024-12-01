import { Candidate } from "./model/candidate.js";
import { Interviewer } from "./model/interviwer.js";

import { asyncError } from "./middlewares/error.js";
import ErrorHandler from "./utils/error.js";
import bcrypt from "bcryptjs";
import { sendToken } from "./utils/helper.js";

export const loginController = asyncError(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password)
    return next(new ErrorHandler("Please enter email and password", 400));

  const [candidate, interviwer] = await Promise.all([
    Candidate.findOne({ email }).select("+password"),
    Interviewer.findOne({ companyEmail: email }).select("+password"),
  ]);

  const user = candidate || interviwer;

  if (!user) return next(new ErrorHandler("Invalid credentials", 401));

  const isPasswordMatched = await bcrypt.compare(password, user.password);

  if (!isPasswordMatched)
    return next(new ErrorHandler("Invalid credentials", 401));

  sendToken(user, res, `User ${user.name} logged in successfully`, 200);
});
