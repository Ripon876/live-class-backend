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
	age: {
		type: String,
		default: "",
	},
	phone: {
		type: String,
		default: "",
	},
	address: {
		type: String,
		default: "",
	},
	city: {
		type: String,
		default: "",
	},
	type: {
		type: String,
		default: "student",
	},
	rooms: [],
});

const User = mongoose.model("User", userSchema);

module.exports = User;
