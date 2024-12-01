import { Room } from "./model/room.js";

import { asyncError } from "./middlewares/error.js";
import ErrorHandler from "./utils/error.js";

export const joinRoomController = asyncError(async (req, res, next) => {
  const { roomId, userId } = req.body;

  const room = await Room.findOne({ roomId });

  if (!room) return next(new ErrorHandler("Room not found", 404));

  if (
    ![room.candidateId.toString(), room.interviewerId.toString()].includes(
      userId
    )
  )
    return next(new ErrorHandler("Invalid user", 400));

  if (room.roomStatus !== "active")
    return next(new ErrorHandler("Room is not active", 400));

  res.status(200).json({
    success: true,
    data: room.roomId,
  });
});
