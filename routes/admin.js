const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
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
		createRole(req, res, "teacher", "Instructor");
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
			"-_id",
			"-__v",
		]);
		res.status(200).send({
			students,
		});
	} catch (err) {
		console.log(err);
		res.status(500).json({
			message: "Error getting students",
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
			message: "Class Added Successfully",
			class: newClass,
		});
	} catch (err) {
		console.log(err);
		res.status(500).json({
			message: "Error creating class",
			err,
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
			err,
		});
	}
});

module.exports = router;

const getRoles = async (req, res, role) => {
	const roles = await User.find({ type: role }).select([
		"-password",
		"-type",
		"-__v",
	]);
	res.status(200).send({
		roles,
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
		message: "Instructor removed successfully",
	});
};
