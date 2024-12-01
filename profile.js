import { Candidate } from "./model/candidate.js";
import { Interviewer } from "./model/interviwer.js";

import { asyncError } from "./middlewares/error.js";
import ErrorHandler from "./utils/error.js";

import jwt from "jsonwebtoken";

export const getMyProfile = asyncError(async (req, res, next) => {

    const { token } = req.cookies;

    if (!token) {
        return next(new ErrorHandler("Login to access this resource", 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [candidate, interviewer] = await Promise.all([
        Candidate.findById(decoded._id),
        Interviewer.findById(decoded.id)
    ])

    if (candidate) {
        req.candidate = candidate;
    } else {
        req.interviewer = interviewer;
    }

    let user = candidate || interviewer;

    res.status(200).json({
        success: true,
        user: user
    })
})