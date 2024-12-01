import { Schema, model } from "mongoose";
import jwt from "jsonwebtoken";
import { SKILLS as skills, AREA_OF_STUDY as areaOfStudy } from "../constants/data.js";

const candidateSchema = new Schema({
  name: {
    type: String,
    required: [true, "Please provide a name"],
  },
  email: {
    type: String,
    required: [true, "Please provide an email"],
    unique: true,
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    select: false,
  },
  phoneNumber: {
    type: String,
    default: "",
  },
  profilePic: {
    public_id: {
      type: String,
    },
    url: {
      type: String,
      default: "",
    },
  },
  institutationName: {
    type: String,
    default: "",
  },
  DOB: {
    type: Date,
    default: "",
  },
  skills: {
    type: [String],
    enum: skills,
    validate: {
      validator: (skills) => skills.every((skill) => skills.includes(skill)),
      message: "One or more skills are invalid",
    },
    default: [],
  },
  resume: {
    public_id: {
      type: String,
    },
    url: {
      type: String,
      default: "",
    },
  },
  role: {
    type: String,
    default: "candidate",
  },
  areaOfStudy: {
    type: String,
    enum: areaOfStudy,
  },
  yearsOfExperience: {
    type: Number,
    default: 0,
  },
  githubLink: {
    type: String,
    default: "",
  },
  linkedinLink: {
    type: String,
    default: "",
  },
  appliedJobs: [
    {
      type: Schema.Types.ObjectId,
      ref: "Job",
    },
  ],
});

candidateSchema.methods.generateToken = function () {
  return jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

export const Candidate = model("Candidate", candidateSchema);
