import { Schema, model } from "mongoose";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { CATEGORIES as catg } from "../constants/data.js";

const interviwerSchema = new Schema({
  name: {
    type: String,
    required: [true, "Please provide a name"],
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    select: false,
  },
  verfied: {
    type: Boolean,
    default: false,
  },
  verifyToken: {
    type: String,
    default: "",
  },
  verifyTokenExpire: {
    type: Date,
    default: Date.now() + 10 * 60 * 1000,
  },
  companyName: {
    type: String,
    required: [true, "Please provide a company name"],
  },
  companyEmail: {
    type: String,
    required: [true, "Please provide a company email"],
  },
  domainOfRecruitment: {
    type: [String],
    required: [true, "Please provide a domain of recruitment"],
    enum: catg,
  },
  role: {
    type: String,
    default: "interviewer",
  },
  jobs: [
    {
      type: Schema.Types.ObjectId,
      ref: "Job",
    },
  ],
});

interviwerSchema.methods.generateToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

interviwerSchema.methods.generateVerifyToken = function () {
  const verifyToken = crypto.randomBytes(32).toString("hex");

  this.verifyToken = verifyToken;
  this.verifyTokenExpire = Date.now() + 10 * 60 * 1000;
  return verifyToken;
};

export const Interviewer = model("Interviewer", interviwerSchema);
