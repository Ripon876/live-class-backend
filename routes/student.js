const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const Class = require("../models/class");
const Mark = require("../models/mark");

router.get("/get-classes", auth, async (req, res) => {
	try {
		// const classes = await Class.find({});
		let classes = await Class.find({
			students: { $in: [req.user.id] },
		}).select(["-students"]);

		let cls = await Class.findById(classes[0]?._id).select([
			"students",
			"-_id",
		]);
		let firstClassIndex = cls.students.indexOf(req.user.id);
		// console.log("classes :", classes[firstClassIndex]._id);
		res.status(200).send({
			classes: classes,
			firstClassIndex,
		});
	} catch (err) {
		console.log(err);
		res.status(500).json({
			message: "Error creating acount",
			err,
		});
	}
});

router.get("/get-result", auth, async (req, res) => {
	try {
		let marks = await Mark.find({
			cId: req.user.id,
			date: new Date().toJSON().slice(0, 10),
		});

		res.status(200).send({
			marks,
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
