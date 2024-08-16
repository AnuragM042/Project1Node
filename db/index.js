import mongoose from "mongoose";
import {DB_NAME} from "../src/constants.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(`\n MongoDb connectd , DB host : ${connectionInstance}`);
    // console.log("MOngodb Connected")
  } catch (error) {
    console.log("MONGODB connection error ", error);
    process.exit(1);
  }
};

export default connectDB 