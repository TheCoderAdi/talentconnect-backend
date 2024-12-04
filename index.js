import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import cookieParser from "cookie-parser";
import cloudinary from "cloudinary";
import { Server } from "socket.io";
import http from "http";

import { connectToDataBase } from "./conntection.js";
import { errorMiddleWare } from "./middlewares/error.js";
import { loginController } from "./loginController.js";
import { joinRoomController } from "./joinroom.js";

dotenv.config();
connectToDataBase(process.env.MONGO_URI);

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
export const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

app.get("/", (req, res) => {
  res.json({ message: "API is running..." });
});

import candidateRoutes from "./routes/candidate.js";
import interviewerRoutes from "./routes/interviwer.js";
import { getMyProfile } from "./profile.js";

app.post("/login", loginController);
app.post("/join-room", joinRoomController);
app.get("/get-profile", getMyProfile)

app.use("/candidate", candidateRoutes);
app.use("/interviewer", interviewerRoutes);
app.use(errorMiddleWare);

import { GoogleGenerativeAI } from "@google/generative-ai";
import { Room } from "./model/room.js";
const connections = {};
const roomData = {};

io.on("connection", (socket) => {
  socket.on("joinRoom", ({ roomId, userId, role }) => {

    let isRoomExist = Room.findOne({ roomId });
    if (!isRoomExist) {
      socket.emit("error", { message: "Room not found" });
      return;
    }

    if (!connections[roomId]) {
      connections[roomId] = [];
      roomData[roomId] = { candidateId: null, interviewerId: null };
    }

    if (role === "candidate") {
      if (roomData[roomId].candidateId) {
        socket.emit("error", { message: "Room already has a candidate" });
        return;
      }
      roomData[roomId].candidateId = userId;
    } else if (role === "interviewer") {
      if (roomData[roomId].interviewerId) {
        socket.emit("error", { message: "Room already has an interviewer" });
        return;
      }
      roomData[roomId].interviewerId = userId;
    }

    connections[roomId].push(socket.id);
    socket.join(roomId);

    if (roomData[roomId].candidateId && roomData[roomId].interviewerId) {
      io.to(roomId).emit("roomReady");
    } else {
      socket.emit("waitingForOther");
    }
  });

  socket.on("signal", (roomId, message) => {
    socket.to(roomId).emit("signal", message);
  });

  socket.on("disconnect", () => {
    for (const roomId in connections) {
      connections[roomId] = connections[roomId].filter((id) => id !== socket.id);
      if (connections[roomId].length === 0) {
        delete connections[roomId];
        delete roomData[roomId];
      }
    }
  });
});

server.listen(process.env.PORT, () => {
  console.log(`Service is running on PORT ${process.env.PORT}`);
});
