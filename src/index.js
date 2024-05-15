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
