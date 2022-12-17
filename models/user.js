const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
	email: {
		type: String,
		required: [true, "Please provide an Email!"],
		unique: [true, "Email Exist"],
	},
	password: {
		type: String,
		required: [true, "Please provide a password!"],
		unique: false,
	},
});

const User = mongoose.model("User", userSchema);

module.exports = User;