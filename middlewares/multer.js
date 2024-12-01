import multer from "multer";

const storage = multer.memoryStorage();

export const multiUpload = multer({ storage: storage }).array("files", 2);
