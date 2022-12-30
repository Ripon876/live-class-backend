const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/user");

// register endpoint
router.post("/register", async (req, res) => {
	try {
		await User.findOne({ email: req.body.email }).then((user) => {
			if (!user) {
				bcrypt
					.hash(req.body.password, 10)
					.then((hashedPassword) => {
						const user = new User({
							name: req.body.name,
							email: req.body.email,
							password: hashedPassword,
						});
						user.save()
							.then((user) => {
								res.status(201).json({
									message: "User Created Successfully",
									user,
								});
							})
							.catch((error) => {
								res.status(500).json({
									message: "Error creating acount",
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
			}else{
				res.status(500).json({
				message: "Email Exist",
			});
			}
		});
	} catch (err) {
		console.log(err);
	}
});

// login endpoint
router.post("/login", (req, res) => {
	User.findOne({ email: req.body.email })
		.then((user) => {
			bcrypt
				.compare(req.body.password, user.password)

				.then((passwordCheck) => {
					if (!passwordCheck) {
						return res.status(400).send({
							message: "Passwords does not match",
							error,
						});
					}

					const token = jwt.sign(
						{
							id: user._id,
							email: user.email,
							type: user.type
						},
						process.env.JWT_SECRET,
						{ expiresIn: "24h" }
					);
					res.status(200).send({
						message: "Login Successful",
						email: user.email,
						type: user.type,
						token,
					});
				})
				.catch((error) => {
					res.status(400).send({
						message: "Passwords does not match",
						error,
					});
				});
		})
		.catch((e) => {
			res.status(404).send({
				message: "Email not found",
				e,
			});
		});
});

module.exports = router;
