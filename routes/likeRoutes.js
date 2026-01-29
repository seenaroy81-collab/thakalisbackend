import {
  addLike,
  fetchLikes,
  removeLike,
} from "../controller/likeController.js";
import protect from "../middleWare/userMiddleWare.js";
import express from "express";

const app = express.Router();
app.route("/").post(protect, addLike).get(protect, fetchLikes)
app.route("/:id").delete(protect, removeLike);

export default app;
