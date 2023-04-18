const express = require("express");
const { GetClass } = require("../controllers/roleplayerController");
const router = express.Router();

const auth = require("../middlewares/auth");

router.get("/get-exams", auth, GetClass);

module.exports = router;
