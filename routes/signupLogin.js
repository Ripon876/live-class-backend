const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/user");

// register endpoint
router.post("/register", (req, res) => {
	bcrypt
		.hash(req.body.password, 10)
		.then((hashedPassword) => {
			const user = new User({
				email: req.body.email,
				password: hashedPassword,
			});
			user.save()
				.then((user) => {
					res.status(201).send({
						message: "User Created Successfully",
						user,
					});
				})
				.catch((error) => {
					res.status(500).send({
						message: "Error creating user",
						error,
					});
				});
		})
		.catch((e) => {
			res.status(500).send({
				message: "Password was not hashed successfully",
				e,
			});
		});
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
							userId: user._id,
							userEmail: user.email,
						},
						"RANDOM-TOKEN",
						{ expiresIn: "24h" }
					);
					res.status(200).send({
						message: "Login Successful",
						email: user.email,
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
