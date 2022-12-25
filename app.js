const express = require("express");
const http = require("http");
const app = express();
const cors = require("cors");
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
// socket server
const io = require("socket.io")(server, {
	cors: {
		origin: "http://localhost:3000",
		methods: ["GET", "POST"],
	},
});

// models
const User = require("./models/user");
const Class = require("./models/class");

// cors
const whitelist = ["http://localhost:3000"];
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
app.use(express.json());

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

app.use("/", singupLogin);
app.use("/admin", admin);
app.use("/teacher", teacher);
app.use("/student", student);

// class & students socket id with their own id
const users = {};

// socket handler
io.on("connection", (socket) => {
	console.log("new connection");

	socket.on("disconnect", () => {
		socket.broadcast.emit("callEnded");
	});

	socket.on("setActive", async (data) => {
		users[data?.id] = socket.id;
		console.log(users);
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
		console.log('starting cls')
		socket.broadcast.emit('startClass')
	});

	socket.on("clsEnd", async (data, cb) => {
		let { stdId, clsId } = data;
		console.log(data);

		try {
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
});

// server listening
server.listen(PORT, () => console.log("server is running on port " ,PORT));
