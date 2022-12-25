const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const Class = require("../models/class");

router.get("/get-classes", auth, async (req, res) => {
	try {
		// const classes = await Class.find({});
		let classes = await Class.find({
			students: { $in: [req.user.id] },
		}).select(["-students"]);

		let cls = await Class.findById(classes[0]._id).select([
			"students",
			"-_id",
		]);
		let firstClassIndex = cls.students.indexOf(req.user.id);

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

module.exports = router;
