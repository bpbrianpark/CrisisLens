import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import livepeerRoute from "./routes/livepeerRoute.js";

const app = express();
const port = 8080;

app.use(cors());
app.use(express.json());

dotenv.config();

app.use("/livepeer", livepeerRoute);

app.get("/", (_, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
