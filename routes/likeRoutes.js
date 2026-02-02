import {
  addLike,
  fetchLikes,
  removeLike,
} from "../controller/likeController.js";
import protect from "../middleWare/userMiddleWare.js";
import express from "express";

const app = express.Router();
app.route("/").get(protect, fetchLikes);
app.route("/:id").post(protect, addLike).delete(protect, removeLike);

export default app;
