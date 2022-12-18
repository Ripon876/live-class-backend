const express = require('express');
const router = express.Router();
const auth = require("../middlewares/auth");
const Class = require("../models/class");




router.get("/get-classes", auth, async (req, res) => {
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

module.exports = router;