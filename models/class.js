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
		type: String,
		default: "",
	},
	classDuration: {
		type: Number,
		default: "",
	},
	startTime: {
		type: String,
		default: "",
	},
});

const Class = new mongoose.model('Class',classSchema);

module.exports  = Class;