const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const {
  GetClasses,
  GetClass,
  MarkClassAsOngoing,
  SubmitMark,
} = require("../controllers/teacherController");

router.get("/get-classes", auth, GetClasses);
router.get("/get-class/:id", auth, GetClass);
router.get("/starting-class/:id", auth, MarkClassAsOngoing);
router.post("/submit-mark", auth, SubmitMark);

module.exports = router;
