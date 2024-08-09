import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" })); // to limit json amount
app.use(express.urlencoded({ extended: true, limit: "16kb" })); // if in future url is passed through db (our db )
app.use(express.static("public")); // for storing any assests (img,pdf etc) inside public folder

// for setting and getting access of cookies in users Browsers (CRUD operation)
app.use(cookieParser());

export default app;
