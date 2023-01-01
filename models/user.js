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
	age: Number,
	phone: {
		type: String,
		default: "",
	},
	type: {
		type: String,
		default: "student",
	},
});

const User = mongoose.model("User", userSchema);

module.exports = User;
