const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const Class = require("../models/class");

// {
//   "_id": {
//     "$oid": "639ee97fba29b1f3e21ebc4a"
//   },
//   "title": "class 1",
//   "subject": "English",
//   "teacher": {
//     "_id": "639edda737e03af7cdbe3149",
//     "name": "Teacher 1",
//     "__v": 0
//   },
//   "classDuration": 5,
//   "startTime": "10:30",
//   "__v": 0
// }

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

module.exports = router;
