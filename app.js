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
		methods: ["GET", "POST"],
	},
});

// models
const User = require("./models/user");
const Class = require("./models/class");

// cors
const whitelist = [
	"http://localhost:3000",
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
app.use(cors(corsOptions));

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

// class & students socket id with their own id
const users = {};
let studentsStates = {};

// socket handler
io.on("connection", (socket) => {
	console.log("new connection");

	socket.on("disconnect", () => {
		socket.broadcast.emit("callEnded");
	});

	socket.on("setActive", async (data) => {
		users[data?.id] = socket.id;
		// console.log(users);
	});

	socket.on("getClass", async (id, cb) => {
		try {
			const cls = await Class.findById(id).select([
				"-students",
				"-hasToJoin",
				"-status",
			]);
			await cb(cls);
		} catch (err) {
			console.log("err on gettting cls : ", err);
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

	socket.on("startClasses", async (cb) => {
		console.log("starting cls");
		socket.broadcast.emit("startClass");
		cb("Classes has been started", "");
	});

	socket.on("clsEnd", async (data, cb) => {
		let { stdId, clsId } = data;
		console.log("cls end", data);

		try {
			socket.emit("cdChanging");

			let cls = await Class.findById(clsId);

			let stdIndex = await cls?.students?.indexOf(stdId);
			let stds = cls?.students;
			stds?.splice(stdIndex, 1);
			cls.students = stds;
			cls.hasToJoin--;

			if (cls.hasToJoin === 0) {
				cls.status = "Finished";
				io.to(users[cls.teacher._id]).emit(
					"allClassEnd",
					"No More Class (:"
				);
				if (cls.roleplayer) {
					io.to(users[cls.roleplayer._id]).emit(
						"allClassEnd",
						"No More Class (:"
					);
				}

				checkAllClass(socket);
				console.log("all students taken class", clsId);
			}

			await cls.save();

			let classes = await Class.find({
				students: { $in: [stdId] },
			}).distinct("_id");

			if (classes.length > 0) {
				cb({
					type: "joinNextClass",
					id: classes[0],
				});
			} else {
				cb({
					type: "allClassEnd",
					text: "No More Class (:",
				});
			}
		} catch (err) {
			console.log(err);
		}
	});

	socket.on("newClassStarted", async (stdId, clsId) => {
		try {
			let cls = await Class.findById(clsId).select([
				"_id",
				"subject",
				"teacher",
			]);
			let std = await User.findById(stdId).select(["name"]);
			let state = {
				cls: {
					_id: cls._id,
					subject: cls.subject,
					teacher: cls.teacher.name,
				},
				student: {
					name: std.name,
					_id: std._id,
				},
			};
			studentsStates[stdId] = state;
			console.log(studentsStates);
			socket.broadcast.emit("studentsStates", studentsStates);
		} catch (err) {
			console.log(err);
		}
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

	// ===========
	//  admin
	// =============

	socket.on("getExamsStates", (cb) => {
		cb(studentsStates);
	});
});

app.get("/", (req, res) => {
	res.status(200).send({
		serverStatus: "ok",
	});
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
		console.log(err);
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
		// console.log(err);
		res.status(500).json({
			message: "Error updating profile",
			err,
		});
	}
});

setInterval(() => {
	axios
		.get("https://live-class.onrender.com")
		.then((res) => {
			console.log("server is running");
		})
		.catch((err) => {
			console.log(err);
		});
}, 600 * 1000);

const checkAllClass = async (socket) => {
	try {
		let classes = await Class.find({
			status: "Not Started",
		});
		if (classes.length === 0) {
			socket.broadcast.emit("allClsTaken");
			studentsStates = {};
		}
		// console.log("classes", classes);
	} catch (err) {
		console.log(err);
	}
};

// server listening
server.listen(PORT, () => console.log("server is running on port ", PORT));
