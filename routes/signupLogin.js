const express = require("express");
const router = express.Router();
const {
  RegisterStudent,
  LoginUsers,
} = require("../controllers/authController");

router.post("/register", RegisterStudent);

router.post("/login", LoginUsers);

module.exports = router;
