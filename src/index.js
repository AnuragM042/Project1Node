// require('dotenv').config()
import dotenv from "dotenv";
import connectDB from "../db/index.js";
import app from "./app.js";
import { asyncHandler } from "../utils/asyncHandler.js";

dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    const port = app.listen(process.env.PORT || 9000, () => {
      console.log(`server is running at ${port}}`);

      //   console.log(port)
    });
  })
  .catch((err) => {
    console.log("db error at index", err);
  });











  

/*7
For writing both express and db inside one module 

import express from 'express'
const app = express()

(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    app.on("error",(error)=>{
        console.log("Error: express",error);
        throw error
    })
    app.listen(process.env.PORT,()=>{
        console.log(`app is listening on port ${process.env.PORT}`);
    })
  } catch (error) {
    console.error("Error", error);
    throw err;
  }
})();
*/
