const mongoose = require("mongoose");
// {
//   title: 'dsfsdfdsfds',
//   subject: 'Physics',
//   teacher: 'Mark',
//   classDuration: '2',
//   startTime: '10:32'
// }
const classSchema = new mongoose.Schema({
	title: {
		type: String,
		default: "",
	},
	subject: {
		type: String,
		default: "",
	},
	teacher: {
		_id: String,
		name: String,
	},
	classDuration: {
		type: Number,
		default: "",
	},
	startTime: {
		type: String,
		default: "",
	},
	status: {
		type: String,
		default: "notStarted",
	},
	createdAt: { type: Date, expires: "24h", default: Date.now },
});

const Class = new mongoose.model("Class", classSchema);

module.exports = Class;
