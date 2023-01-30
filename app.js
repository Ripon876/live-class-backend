const express = require("express");
const http = require("http");
const app = express();
const cors = require("cors");
const axios = require("axios");
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
// socket server
const io = require("socket.io")(server, {
	cors: {
		origin: "http://localhost:3000",
		// origin: "https://live-video-class.netlify.app",
		// origin: "https://rfatutors-osler.app",
		methods: ["GET", "POST"],
	},
});

// models
const User = require("./models/user");
const Class = require("./models/class");

// cors
const whitelist = [
	"http://localhost:3000",
	"https://rfatutors-osler.app",
	"https://live-video-class.netlify.app",
];
const corsOptions = {
	origin: function (origin, callback) {
		if (!origin || whitelist.indexOf(origin) !== -1) {
			callback(null, true);
		} else {
			callback(new Error("Not allowed by CORS"));
		}
	},
	credentials: true,
};
// app.use(cors(corsOptions));
app.use("*", cors());

// default body parser
app.use(express.json({ limit: "10mb" }));

// mongodb connection
const dbConnect = require("./db/dbConnect");
dbConnect(); // connecting to db

// auth middleware
const auth = require("./middlewares/auth");

// ==========
//  routes
// ============

const generataList = require("./CreateList");
const singupLogin = require("./routes/signupLogin");
const admin = require("./routes/admin");
const teacher = require("./routes/teacher");
const student = require("./routes/student");
const roleplayer = require("./routes/roleplayer");

app.use("/", singupLogin);
app.use("/admin", admin);
app.use("/teacher", teacher);
app.use("/student", student);
app.use("/roleplayer", roleplayer);

// importing watcher class
const Watcher = require("./watcher");

// class & students socket id with their own id
const users = {};
let studentsStates = {};
let online = [];

let watcher;
let roomId = "sdfdsj23432dfdfgfd";

// socket handler
io.on("connection", (socket) => {
	console.log("new connection");
	socket.on("setActive", async (data) => {
		socket.join(data?.id);

		users[data?.id] = socket.id;
		if (watcher) {
			watcher.updateUsers(users);
		}
		// console.log(users);
	});
	socket.on("disconnect", () => {
		let user = Object.keys(users).find((key) => users[key] === socket.id);

		if (user in studentsStates) {
			io.to(users[studentsStates[user].cls.t_id]).emit(
				"stdDisconnected",
				user
			);
			io.to(users[studentsStates[user].cls?.r_id]).emit(
				"stdDisconnected",
				user
			);
			delete studentsStates[user];
			socket.broadcast.emit("studentsStates", studentsStates);
		} else {
			let s1 = Object.keys(studentsStates).find(
				(key) => studentsStates[key]?.cls?.t_id === user
			);
			let s2 = Object.keys(studentsStates).find(
				(key) => studentsStates[key]?.cls?.r_id === user
			);

			if (s1) {
				io.to(users[s1]).emit("exDisconnected", user);
			}
			if (s2) {
				io.to(users[s2]).emit("roDisconnected", user);
			}
			delete studentsStates[user];
			socket.broadcast.emit("studentsStates", studentsStates);
		}
	});

	socket.on("getStdDetails", async (id, cb) => {
		try {
			let std = await User.findById(id).select(["name"]);
			cb(std);
		} catch (err) {
			console.log("err: ", err);
		}
	});

	socket.on("getClass", async (id, cb) => {
		try {
			const cls = await Class.findById(id).select([
				"-students",
				"-status",
			]);

			if (cls === null || cls.length === 0 || cls.status === "Finished") {
				await cb(null, true);
			} else {
				await cb(cls, false);
			}
		} catch (err) {
			console.log("err on gettting cls : ", err);
		}
	});

	socket.on("getCd", async (examID, cb) => {
		try {
			let state = watcher.getState();

			let cdId = state[examID].cd;

			let std = await User.findById(cdId).select(["name"]);
			cb({
				name: std.name,
				id: std._id,
			});
		} catch (err) {
			console.log(err);
		}
	});

	socket.on("getStudent", async (id, cb) => {
		try {
			let std = await User.findById(id).select(["name", "_id"]);
			await cb(std);
		} catch (err) {
			console.log("err on gettting cls : ", err);
		}
	});

	socket.on("startClasses", async (data, cb) => {
		let ems = await Class.find({
			status: "Not Started",
		});
		let cds = await User.find({
			type: "student",
		});

		if (ems.length === cds.length) {
			socket.broadcast.emit("startClass");
			setTimeout(async () => {
				await startWatcher(data);
			}, 1000);

			cb("Exams will start after 10s", "");
		} else {
			console.log("not equal");
			cb("", "Number of Exams & Candidates are not equal");
		}
	});

	socket.on("rejoin", async (stdId, cb) => {
		try {
			let state = await watcher.rejoin(stdId);

			cb(state, null);
		} catch (err) {
			cb(null, err);
		}
	});

	socket.on("newStationStarted", async (examID, cb) => {
		try {
			let state = watcher.getState();

			let cdId = state[examID].cd;

			let cls = await Class.findById(examID).select([
				"_id",
				"subject",
				"teacher",
				"classDuration",
				"roleplayer",
			]);

			let std = await User.findById(cdId).select(["name"]);
			let newState = {
				cls: {
					_id: examID,
					teacher: cls.teacher.name,
					t_id: cls.teacher._id,
					r_id: cls?.roleplayer?._id,
					roleplayer: cls?.roleplayer?.name,
				},
				student: {
					name: std.name,
					_id: std._id,
				},
				startTime: new Date().toUTCString(),
				duration: cls.classDuration,
			};

			studentsStates[cdId] = newState;
			socket.broadcast.emit("studentsStates", studentsStates);

			cb({
				name: std.name,
				id: std._id,
			});
		} catch (err) {
			console.log(err);
		}
	});

	// ===========
	//  candidate
	// =============

	/*	socket.on("getStudentExamState", (stdId, cb) => {
		if (watcher) {
			let state = watcher.getState();
			cb(state);
		}
	});*/
	socket.on("getStudentExamState", (stdId, cb) => {
		let state = studentsStates[stdId];
		cb(state);
	});
	// ===========
	//  roleplayer
	// =============

	socket.on("joinRolplayer", async (rpPId, exId) => {
		io.to(users[exId]).emit("joinRolplayer", rpPId);
	});

	socket.on("addWithRoleplayer", async (stdId, clsId) => {
		// console.log('adding with roleplayer')
		let exam = await Class.findById(clsId).select(["roleplayer"]);
		io.to(users[exam.roleplayer._id]).emit("joinCandidate", stdId);
	});

	socket.on("reConnectWithRp", async (clsId) => {
		let cls = await Class.findById(clsId).select(["-_id", "teacher"]);
		io.to(users[cls.teacher._id]).emit("connectWithRp");
	});

	// ===========
	//  admin
	// =============

	socket.on("getExamsStates", (cb) => {
		cb(studentsStates);
	});

	socket.on("clearStates", (cb) => {
		studentsStates = {};
		cb(studentsStates);
	});
	socket.on("getExamInfo", (id, cb) => {
		let exm = Object.values(studentsStates)?.find((e) => e.cls._id == id);

		cb(exm);
	});

	// ==========================
	//  For all role except admin
	// ==========================

	socket.on("getExamId", async (user, cb) => {
		try {
			if (user.type === "student") {
				let classes = await Class.find({
					students: { $in: [user.id] },
					status: "Not Started",
				}).select(["-students"]);

				let cls = await Class.findById(classes[0]?._id).select([
					"students",
					"-_id",
				]);
				let firstExamId = cls?.students?.indexOf(user?.id);
				// console.log(classes, firstExamId);

				cb(false, classes[firstExamId]?._id.toString());
			} else if (
				user?.type === "teacher" ||
				user?.type === "roleplayer"
			) {
				let query = {
					[user?.type + "._id"]: user?.id,
					status: "Not Started",
				};
				let exam = await Class.find(query).select(["_id"]);
				// console.log(exam);
				cb(false, exam[0]?._id?.toString());
			}
		} catch (err) {
			// console.log(err);
			cb(true);
		}
	});
});

app.get("/", (req, res) => {
	res.status(200).send({
		serverStatus: "ok",
	});
});

app.post("/get-exam-id", async (req, res) => {
	// console.log(req.body);
	// console.log("htting route");

	let user = req.body;
	try {
		if (user.type === "student") {
			let classes = await Class.find({
				students: { $in: [user.id] },
				status: "Not Started",
			}).select(["-students"]);

			let cls = await Class.findById(classes[0]?._id).select([
				"students",
				"-_id",
			]);
			let firstExamId = cls?.students?.indexOf(user?.id);
			// console.log(classes, firstExamId);

			res.status(200).send({
				id: classes[firstExamId]?._id.toString(),
			});
		} else if (user?.type === "teacher" || user?.type === "roleplayer") {
			let query = {
				[user?.type + "._id"]: user?.id,
				status: "Not Started",
			};
			let exam = await Class.find(query).select(["_id"]);
			// console.log(exam);

			res.status(200).send({
				id: exam[0]?._id?.toString(),
			});
		}
	} catch (err) {
		res.status(500).json({
			message: "Error getting user",
			err,
		});
	}
});

app.get("/get-user-details", auth, async (req, res) => {
	try {
		const user = await User.findById(req.user.id).select([
			"-password",
			"-type",
			"-_id",
			"-__v",
		]);
		res.status(200).send({
			user,
		});
	} catch (err) {
		res.status(500).json({
			message: "Error getting user",
			err,
		});
	}
});

app.put("/update-user-details", auth, async (req, res) => {
	try {
		const user = await User.findByIdAndUpdate(req.user.id, req.body, {
			new: true,
		});
		res.status(200).send({
			message: "Profile updated",
		});
	} catch (err) {
		res.status(500).json({
			message: "Error updating profile",
			err,
		});
	}
});

app.get("/get-start-time", async (req, res) => {
	try {
		let examTiem = await Class.find({
			status: "Not Started",
		}).select(["startTime"]);
		if (examTiem.length !== 0) {
			res.status(200).send({
				st: examTiem[0]?.startTime,
				msg: "",
			});
		} else {
			res.status(200).send({
				st: 0,
				msg: "Exams Ended, wait for next schedule",
			});
		}
	} catch (err) {
		res.status(500).json({
			message: "Error updating profile",
			err,
		});
	}
});

app.get("/get-rooms/:id", async (req, res) => {
	try {
		console.log(req.params.id);
		let rooms = await User.findById(req.params.id).select([
			"rooms",
			"type",
		]);

		if (rooms.type !== "student") {
			if (rooms.type === "teacher" || rooms.type === "roleplayer") {
				let query = {
					[rooms?.type + "._id"]: rooms?.id,
					status: "Not Started",
				};
				let exam = await Class.find(query).select(["_id"]);

				// {
				//     "roomId": "63d46efac23becb0990f6884",
				//     "time": "Sat, 28 Jan 2023 02:00:00 GMT",
				//     "durarion": 2,
				//     "delay": false
				// }

				res.status(200).send({
					rooms: [
						{
							roomId: exam[0]?._id?.toString(),
							time: exam[0].startTime,
							duration: exam[0].classDuration,
							delay: false,
						},
					],
					msg: "Rooms",
				});
			}
		} else {
			console.log(rooms);
			if (rooms?.rooms.length > 0) {
				res.status(200).send({
					rooms: rooms.rooms,
					msg: "Rooms",
				});
			}
		}
	} catch (err) {
		res.status(500).json({
			message: "Error getting rooms",
			err,
		});
	}
});

app.post("/markOnline", async (req, res) => {
	try {
		// { type: 'student', cd: { name: 's2' }, ex: { name: 'Ex 1' } }

		delete req.body.type;

		let itemIndex = online.findIndex((item) => item.cd === req.body.cd);
		if (itemIndex == 0 || itemIndex > 0) {
			online.splice(itemIndex, 1, req.body);
		} else {
			online.push(req.body);
		}

		io.to(req.body.ex._id).emit("stdInfo", req.body);
		if (req.body?.rp?._id) {
			io.to(req.body.rp._id).emit("stdInfo", req.body);
		}

		res.status(200).send({
			msg: "Marked Online",
		});
	} catch (err) {
		res.status(500).json({
			message: "Error marking online",
			err,
		});
	}
});

app.post("/unmarkOnline", async (req, res) => {
	try {
		// { type: 'student', cd: { name: 's2' }, ex: { name: 'Ex 1' } }

		delete req.body.type;

		let itemIndex = online.findIndex((item) => item.exam === req.body.exam);
		if (itemIndex == 0 || itemIndex > 0) {
			online.splice(itemIndex, 1);
		}
		io.to(req.body.ex._id).emit("candidateDisconnected");

		if (req.body?.rp?._id) {
			io.to(req.body.rp._id).emit("candidateDisconnected");
		}

		res.status(200).send({
			msg: "unMarked Online",
		});
	} catch (err) {
		res.status(500).json({
			message: "Error unmarking online",
			err,
		});
	}
});

app.post("/getCD", async (req, res) => {
	try {
		let cd = online.find((item) => item.exam === req.body.id);

		res.status(200).send({
			cd: cd,
			msg: "Marked Online",
		});
	} catch (err) {
		res.status(500).json({
			message: "Error getting candidate",
			err,
		});
	}
});

const checkAllClass = async (socket) => {
	try {
		let classes = await Class.find({
			status: "Not Started",
		});
		if (classes.length === 0) {
			watcher = null;
			console.log("stoping watcher");
			socket.broadcast.emit("allClsTaken");
			studentsStates = {};
		}
	} catch (err) {
		console.log(err);
	}
};

const startWatcher = async (data) => {
	const Watcher_V2 = require("./watcher-version2");
	let exams = await Class.find({});

	const clearStates = () => {
		studentsStates = {};
		io.sockets.emit("studentsStates", studentsStates);
		watcher = null;
	};
	watcher = new Watcher_V2(exams, io, users, data, clearStates);

	// await generataList(cls, data.breakAfter, data.breakDuraion);

	console.log("starting exams");
	watcher.start();
	return;
};

// server listening
server.listen(PORT, () => console.log("server is running on port ", PORT));

// (async () => {
// 	const cls = await Class.find({});
// 	setTimeout(async () => {
// 		console.log("generating room list");
// 	}, 5000);
// })();
