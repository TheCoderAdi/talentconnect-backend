import { Schema, model } from "mongoose";
import { CATEGORIES as catg, AREA_OF_STUDY as aos } from "../constants/data.js";

const jobSchema = new Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
  },
  description: {
    type: String,
    required: [true, "Description is required"],
  },
  startDate: {
    type: Date,
    required: [true, "Start date is required"],
  },
  endDate: {
    type: Date,
    required: [true, "End date is required"],
  },
  yearsOfExperience: {
    type: Number,
    required: [true, "Years of experience is required"],
  },
  location: {
    type: String,
    required: [true, "Location is required"],
  },
  areaOfStudy: {
    type: String,
    required: [true, "Area of study is required"],
    enum: aos,
  },
  companyName: {
    type: String,
    required: [true, "Company name is required"],
  },
  category: {
    type: String,
    required: [true, "Category is required"],
    enum: catg,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "Interviewer",
  },
  applications: [
    {
      type: Schema.Types.ObjectId,
      ref: "Application",
    },
  ],
  status: {
    type: String,
    enum: ["open", "closed"],
    default: "open",
  },
}
  , {
    timestamps: true
  });

export const Job = model("Job", jobSchema);
