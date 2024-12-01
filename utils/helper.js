import nodemailer from "nodemailer";

export const sendToken = (user, res, message, statusCode) => {
  const token = user.generateToken();

  res.status(statusCode).cookie("token", token, cookieOptions).json({
    success: true,
    message,
    user
  });
};

export const cookieOptions = {
  secure: process.env.NODE_ENV === "Development" ? false : true,
  httpOnly: process.env.NODE_ENV === "Development" ? false : true,
  sameSite: process.env.NODE_ENV === "Development" ? false : "none",
};

export const getBase64 = (file) =>
  `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

export const sendMail = async (mail, subject, htmlcontent) => {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  let mailOptions = {
    from: process.env.EMAIL,
    to: mail,
    subject,
    html: htmlcontent,
  };

  await transporter.sendMail(mailOptions);
};
