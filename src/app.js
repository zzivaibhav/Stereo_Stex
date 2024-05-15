import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();
/*cors allow access to the network from the 
cross-origin. means www.example.com can allow 
resource usage to the www.api.com is the later
 one is whitelisted in the former one.*/
app.use(
  cors({
    origin: process.env.CORS_ORIGIN, //whitelisted the given url
    credentials: true,
  })
);

app.use(express.json({ limit: "20kb" }));
app.use(
  express.urlencoded({
    extended: true,
    limit: "20kb",
  })
);

app.use(express.static("public"));
app.use(cookieParser());
export { app };
