const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const User = require("../models/user");
const Class = require("../models/class");

router.get("/get-classes", async (req, res) => {
	try {
		const classes = await Class.find({});
		res.status(200).send({
			classes: classes,
		});
	} catch (err) {
		console.log(err);
		res.status(500).json({
			message: "Error creating acount",
			error,
		});
	}
});

router.get("/get-teachers", async (req, res) => {
	try {
		const teachers = await User.find({ type: "teacher" }).select([
			"-password",'-email' , '-type'
		]);
		res.status(200).send({
			teachers: teachers,
		});
	} catch (err) {
		console.log(err);
		res.status(500).json({
			message: "Error creating acount",
			error,
		});
	}
});

router.post("/create-new-class", auth, async (req, res) => {
	try {
		const newClass = await new Class(req.body);
		await newClass.save();
		res.status(200).send({
			message: "Class Added Successfully",
			class: newClass,
		});
	} catch (err) {
		console.log(err);
		res.status(500).json({
			message: "Error creating class",
			error,
		});
	}
});

router.delete("/delete-class", async (req, res) => {
	try {
		const id = req.body.id;
		console.log(id);
		await Class.findByIdAndRemove(id);
		res.status(200).send({
			message: "Class delete successfully",
		});
	} catch (err) {
		console.log(err);
		res.status(500).json({
			message: "Error deleteing class",
			error,
		});
	}
});

module.exports = router;
