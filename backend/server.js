import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import admin from "firebase-admin";

import livepeerRoute, { initializeController } from "./routes/livepeerRoute.js";

const app = express();
const port = 8080;

app.use(cors());
app.use(
  express.json({
    verify: (req, _res, buf) => {
      // Preserve raw body for webhook signature verification
      req.rawBody = buf;
    },
  })
);

dotenv.config();

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

const db = admin.firestore();

// Initialize the controller with the db instance
initializeController(db);

app.use("/livepeer", livepeerRoute);

app.get("/", (_, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
