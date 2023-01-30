const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const auth = require("../middlewares/auth");
const User = require("../models/user");
const Class = require("../models/class");
const Mark = require("../models/mark");

router.get("/get-classes", async (req, res) => {
	try {
		const classes = await Class.find({}).select(["-pdf"]);

		res.status(200).send({
			classes: classes,
		});
	} catch (err) {
		console.log(err);
		res.status(500).json({
			message: "Error getting acount",
			err,
		});
	}
});

router.get("/get-exam/:id", async (req, res) => {
	try {
		const exam = await Class.findById(req.params.id);
		res.status(200).send({
			exam: exam,
		});
	} catch (err) {
		console.log(err);
		res.status(500).json({
			message: "Error getting exam",
			err,
		});
	}
});

router.get("/get-teachers", async (req, res) => {
	try {
		const teachers = await User.find({ type: "teacher" }).select([
			"-password",
			"-type",
			"-__v",
		]);
		res.status(200).send({
			teachers: teachers,
		});
	} catch (err) {
		console.log(err);
		res.status(500).json({
			message: "Error getting teachers",
			error,
		});
	}
});
router.get("/get-examiners", async (req, res) => {
	try {
		getRoles(req, res, "teacher");
	} catch (err) {
		console.log(err);
		res.status(500).json({
			message: "Error getting teachers",
			error,
		});
	}
});

router.get("/get-roleplayers", async (req, res) => {
	try {
		getRoles(req, res, "roleplayer");
	} catch (err) {
		console.log(err);
		res.status(500).json({
			message: "Error getting roles",
			error,
		});
	}
});

router.post("/add-instructor", auth, async (req, res) => {
	try {
		createRole(req, res, "teacher", "Examiner");
	} catch (err) {
		console.log(err);
		res.status(500).json({
			message: "Error creating account",
			err,
		});
	}
});

router.post("/add-roleplayer", auth, async (req, res) => {
	try {
		createRole(req, res, "roleplayer", "Roleplayer");
	} catch (err) {
		console.log(err);
		res.status(500).json({
			message: "Error creating account",
			err,
		});
	}
});

router.delete("/remove-roleplayer", async (req, res) => {
	try {
		removeRole(req, res);
	} catch (err) {
		console.log(err);
		res.status(500).json({
			message: "Error deleteing account",
			err,
		});
	}
});

router.delete("/remove-instructor", async (req, res) => {
	try {
		removeRole(req, res);
	} catch (err) {
		console.log(err);
		res.status(500).json({
			message: "Error deleteing account",
			err,
		});
	}
});

router.get("/get-students", async (req, res) => {
	try {
		const students = await User.find({ type: "student" }).select([
			"-password",
			"-type",
			"-__v",
		]);
		res.status(200).send({
			students,
		});
	} catch (err) {
		console.log(err);
		res.status(500).json({
			message: "Error getting candidates",
			err,
		});
	}
});

router.post("/create-new-class", auth, async (req, res) => {
	try {
		// const students = await User.find({ type: "student" }).select(['_id']);
		const students = await User.find({ type: "student" }).distinct("_id");

		const newClass = await new Class(req.body);
		newClass.hasToJoin = students.length;

		newClass.students = students;
		await newClass.save();
		console.log(newClass);
		res.status(200).send({
			message: "Exam Added Successfully",
			class: newClass,
		});
	} catch (err) {
		console.log(err);
		res.status(500).json({
			message: "Error creating exam",
			err,
		});
	}
});

router.delete("/delete-class", async (req, res) => {
	try {
		const id = req.body.id;
		console.log(id);
		await User.deleteMany({
			type: "student",
		});
		await Class.findByIdAndRemove(id);
		await Mark.deleteMany({
			"exam._id": id,
		});
		res.status(200).send({
			message: "Exam delete successfully",
		});
	} catch (err) {
		console.log(err);
		res.status(500).json({
			message: "Error deleteing exam",
			err,
		});
	}
});

// renewing exam

router.get("/renew-exams", auth, async (req, res) => {
	try {
		console.log("New exams start time :", req.query.time);

		await User.deleteMany({
			type: "student",
		});
		await Class.updateMany(
			{
				status: "Finished",
			},
			{
				startTime: req.query.time,
				status: "Not Started",
				hasToJoin: 0,
				students: [],
			}
		);
		let exams = await Class.find({
			status: "Not Started",
		});

		if (exams.length === 0) {
			res.status(500).json({
				message: "Don't have exam to renew",
			});
			return;
		} else {
			res.status(200).send({
				exams: exams,
			});
		}
	} catch (err) {
		console.log(err);
		res.status(500).json({
			message: "Error renewing exams",
			err,
		});
	}
});

module.exports = router;

const getRoles = async (req, res, role) => {
	const roles = await User.find({ type: role }).select(["_id", "name"]);

	const exams = await Class.find({
		status: "Not Started",
	}).select([role, "-_id"]);

	let examsIds = exams.map((item) => item[role]?._id).filter((item) => item);
	let rolesIds = roles
		.map((item) => item._id.toString())
		.filter((item) => item);

	let freeRoles = rolesIds.filter(function (n) {
		return !this.has(n);
	}, new Set(examsIds));

	// console.log("freeRoles :", freeRoles);
	// console.log("roles :", roles);

	// [
	//   { _id: new ObjectId("63b17709f5eab7b9b8f124d0"), name: 'Teacher 1' },
	//   { _id: new ObjectId("63b5ac596cc1ac64cbba8dbd"), name: 'Techer 2' }
	// ]

	let rolesCanAdd = roles.filter((item) =>
		freeRoles.includes(item._id.toString())
	);

	// console.log(rolesCanAdd);

	// console.log("=================");
	res.status(200).send({
		roles: rolesCanAdd,
	});
};

const createRole = async (req, res, role, title) => {
	await User.findOne({ email: req.body.email }).then((user) => {
		if (!user) {
			bcrypt
				.hash(req.body.password, 10)
				.then((hashedPassword) => {
					const user = new User({
						name: req.body.name,
						email: req.body.email,
						password: hashedPassword,
						phone: req.body.phone,
						age: req.body.age,
						type: role,
					});
					user.save()
						.then((user) => {
							res.status(201).json({
								message: title + " added successfully",
								user,
							});
						})
						.catch((error) => {
							res.status(500).json({
								message: "Error creating account",
								error,
							});
						});
				})
				.catch((e) => {
					res.status(500).json({
						message: "Password was not hashed successfully",
						e,
					});
				});
		} else {
			res.status(500).json({
				message: "Email Exist",
			});
		}
	});
};

const removeRole = async (req, res) => {
	const id = req.body.id;

	await User.findByIdAndRemove(id);
	res.status(200).send({
		message: "Removed successfully",
	});
};
