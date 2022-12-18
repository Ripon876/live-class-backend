const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, "Please provide Name"],
	},
	email: {
		type: String,
		required: [true, "Please provide an Email!"],
	},
	password: {
		type: String,
		required: [true, "Please provide a password!"],
	},
	type: {
		type: String,
		default: "student",
	},
});

const User = mongoose.model("User", userSchema);

module.exports = User;
