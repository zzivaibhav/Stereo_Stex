import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";
dotenv.config({ path: "./env" });
connectDB()
  .then(
    app.listen(process.env.PORT || 5000, () => {
      console.log(`\n Server is running on port: ${process.env.PORT}`);
    })
  )
  .catch((error) => {
    console.log("MONGODB CONNECTION FAILED: ", error);
  });

/*
import express from "express";
const app = express();
(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    app.on("error", () => {
      console.log("ERROR: ", error);
      throw error;
    });

    app.listen(process.env.PORT, () => {
      console.log(`APP IS LISTENING ON PORT ${process.env.PORT}`);
    });
  } catch (error) {
    console.log("ERROR: ", error);
    throw error;
  }
})();*/
