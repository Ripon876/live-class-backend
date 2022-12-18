const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const Class = require("../models/class");

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
			message: "Error creating acount",
			error,
		});
	}
});

module.exports = router;
