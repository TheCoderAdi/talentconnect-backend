import { Candidate } from "../model/candidate.js";
import { Interviewer } from "../model/interviwer.js";

import ErrorHandler from "../utils/error.js";
import { asyncError } from "./error.js";

export const isAlreadyEmailExists = asyncError(async (req, res, next) => {

    const { email } = req.body;

    const [candidate, interviewer] = await Promise.all([
        Candidate.findOne({ email }),
        Interviewer.findOne({ companyEmail: email }),
    ]);


    if (candidate || interviewer) {
        return next(new ErrorHandler("Email already exists", 400));
    }

    next();
})