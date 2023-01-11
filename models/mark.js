const mongoose = require("mongoose");

const markSchema = new mongoose.Schema({
	mark: {
		type: Number,
		default: 0,
	},
	comment: {
		type: String,
		default: "",
	},
	list: [],
	exam: {
		_id: String,
		title: String,
	},
	cId: {
		type: String,
		default: "",
	},
	date: {
		type: String,
		default: "",
	},
});

const Mark = new mongoose.model("Mark", markSchema);

module.exports = Mark;
