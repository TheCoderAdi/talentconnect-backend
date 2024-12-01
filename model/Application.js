import { Schema, model } from "mongoose";

const applicationSchema = new Schema({
  candidate: {
    type: Schema.Types.ObjectId,
    ref: "Candidate",
  },
  job: {
    type: Schema.Types.ObjectId,
    ref: "Job",
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
  appliedOn: {
    type: Date,
    default: Date.now(),
  },
});

export const Application = model("Application", applicationSchema);
