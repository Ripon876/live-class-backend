const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");

const {
  GetClasses,
  GetClass,
  GetTeachers,
  GetExaminers,
  GetRoleplayer,
  AddTeacher,
  AddRoleplayer,
  RemoveRoleplayer,
  RemoveTeacher,
  GetStudents,
  AddNewClass,
  RemoveClass,
  RenewClasses,
} = require("../controllers/adminController");

router.get("/get-classes", GetClasses);

router.get("/get-exam/:id", GetClass);

router.get("/get-teachers", GetTeachers);

router.get("/get-examiners", GetExaminers);

router.get("/get-roleplayers", GetRoleplayer);

router.post("/add-instructor", auth, AddTeacher);

router.post("/add-roleplayer", auth, AddRoleplayer);

router.delete("/remove-roleplayer", RemoveRoleplayer);

router.delete("/remove-instructor", RemoveTeacher);

router.get("/get-students", GetStudents);

router.post("/create-new-class", auth, AddNewClass);

router.delete("/delete-class", RemoveClass);

router.get("/renew-exams", auth, RenewClasses);

module.exports = router;
