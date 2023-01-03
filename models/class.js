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
	roleplayer: {
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
	checklist: [],
	pdf: {
		name: String,
		visibleFor: Number,
		file: String,
	},
	status: {
		type: String,
		default: "Not Started",
	},
	hasToJoin: Number,
	students: [String],
	// createdAt: { type: Date, expires: "24h", default: Date.now },
});

const Class = new mongoose.model("Class", classSchema);

module.exports = Class;
