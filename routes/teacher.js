const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const Class = require("../models/class");



// sending all class data
router.get("/get-classes", auth, async (req, res) => {
	try {
		const classes = await Class.find({
			hasToJoin: { $gt: 0 }
		}).select(["-students"]);

		let teacherClasses = classes.filter(
			(cla) => cla.teacher._id === req.user.id
		);


		res.status(200).send({
			classes: teacherClasses,
		});
	} catch (err) {
		console.log(err);
		res.status(500).json({
			message: "Error creating acount",
			error,
		});
	}
});



// sending single class data
router.get("/get-class/:id", auth, async (req, res) => {
	try {
		const cls = await Class.findById(req.params.id);

		res.status(200).send({
			cls: cls,
		});
	} catch (err) {
		console.log(err);
		res.status(500).json({
			message: "Error creating acount",
			err,
		});
	}
});

// marking class as ongoing
router.get("/starting-class/:id", auth, async (req, res) => {
	try {
		let cls = await Class.findById(req.params.id);
		cls.status = "Ongoing";
		await cls.save();
		res.status(200).send({
			msg: "Marked as Ongoing",
		});
	} catch (err) {
		console.log(err);
		res.status(500).json({
			message: "Error creating acount",
			err,
		});
	}
});

module.exports = router;
