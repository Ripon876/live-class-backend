const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const Class = require("../models/class");

router.get("/get-classes", auth, async (req, res) => {
	try {
		const classes = await Class.find({});
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

router.get("/get-class/:id", auth,async (req, res) => {
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

module.exports = router;
