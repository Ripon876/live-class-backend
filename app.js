const express = require("express");
const http = require("http");
const app = express();
const cors = require("cors");
const server = http.createServer(app);

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
	socket.on("disconnect", () => {
		socket.broadcast.emit("callEnded");
	});



socket.on('setActive',async (data) => {
	
	users[data?.id] = socket.id;
	console.log(users)
})

	console.log("new connection");

	socket.on("clsEnd", async (data) => {
		let { stdId, clsId } = data;
		console.log(data);

		try {
			let cls = await Class.findById(clsId);

			let stdIndex = cls.students.indexOf(stdId);
			let stds = cls.students;
			stds.splice(stdIndex, 1);
			cls.students = stds;
			cls.hasToJoin--;
			if (cls.hasToJoin === 0) {
				cls.status = "Finished";
			}

			await cls.save();


let classes = await Class.find({
			students: { $in: [stdId] },
		}).distinct('_id');

if(classes.length > 0) {
	io.to(users[stdId]).emit('nextClass',classes[0]);
}else{
	io.to(users[stdId]).emit('allClassEnd','No More Class (:');
}

		} catch (err) {
			console.log(err);
		}
	});

	// socket.on("clsStarted", (data) => {
	// 	console.log(data.clsId);

	// 	socket.userId = data.clsId;

	// 	classes[data.clsId] = socket.id;

	// 	// console.log(classes);
	// 	// socket.id = data.clsId;
	// 	// console.log('sId : ',socket.id + ' cId : ' ,data.clsId + ' uId : ' ,socket.userId )
	// 	socket.emit("me", socket.userId);
	// });

	// socket.on("callUser", async (data) => {
	// 	let clsId = data.userToCall;
	// 	let stdId = socket.userId;
	// 	let sendTo = classes[data.userToCall];
	// 	console.log("calling : ", data.userToCall, " ", socket.userId);

	// 	// let user = await User.findById(socket.userId);
	// 	// console.log(user);

	// 	let cls = await Class.findById(clsId).select(["students"]);
	// 	console.log(cls.students);
	// 	console.log("std : ", stdId);

	// 	if (cls?.students?.includes(stdId)) {
	// 		io.to(sendTo).emit("callUser", {
	// 			signal: data.signalData,
	// 			from: data.from,
	// 			name: data.name,
	// 		});
	// 	} else {
	// 		io.to(classes[stdId]).emit("alreadyJoined", {
	// 			msg: "You Already Joined that class",
	// 		});

	// 		console.log("cls not going to held");
	// 	}
	// });

	// socket.on("answerCall", async (data) => {
	// 	let clsId = socket.userId;
	// 	let stdId = data.to;
	// 	let sendTo = classes[data.to];

	// 	console.log("allowed : ", data.to, " class id :", socket.userId);

	// 	let cls = await Class.findById(clsId);

	// 	let stdIndex = cls.students.indexOf(stdId);
	// 	let stds = cls.students;
	// 	stds.splice(stdIndex, 1);
	// 	cls.students = stds;
	// 	cls.hasToJoin--;

	// 	if (cls.hasToJoin === 0) {
	// 		cls.status = "Finished";
	// 	}

	// 	await cls.save();

	// 	io.to(sendTo).emit("callAccepted", data.signal);
	// });
});

// 0
// 639eddb137e03af7cdbe314c
// 3af7cdbe314c
// 1
// 639efffd7281c8a9bc9d7004

// 639eddb137e03af7cdbe314c

// (async()=> {
// let classes = await Class.find({
// 			students: { $in: ['639efffd7281c8a9bc9d7004'] },
// 		}).distinct('_id');
// console.log(classes)
// })();



// server listening
server.listen(5000, () => console.log("server is running on port 5000"));
