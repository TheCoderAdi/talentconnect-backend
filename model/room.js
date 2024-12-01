import { Schema, model } from "mongoose";

const roomSchema = Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
  },
  candidateId: {
    type: Schema.Types.ObjectId,
    ref: "Candidate",
    required: true,
  },
  interviewerId: {
    type: Schema.Types.ObjectId,
    ref: "Interviewer",
    required: true,
  },
  roomStatus: {
    type: String,
    enum: ["active", "completed", "waiting"],
    default: "waiting",
  },
  jobId: {
    type: Schema.Types.ObjectId,
    ref: "Job",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export const Room = model("Room", roomSchema);
