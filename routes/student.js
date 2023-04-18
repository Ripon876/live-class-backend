const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const { GetClasses, GetResult } = require("../controllers/studentController");

router.get("/get-classes", auth, GetClasses);

router.get("/get-result", auth, GetResult);

module.exports = router;
