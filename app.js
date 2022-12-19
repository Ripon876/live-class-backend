const express = require("express");
const http = require("http");
const app = express();
const cors = require("cors");
const server = http.createServer(app);
const io = require("socket.io")(server, {
	cors: {
		origin: "http://localhost:3000",
		methods: ["GET", "POST"],
	},
});

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
app.use(express.json());

const dbConnect = require("./db/dbConnect");
dbConnect(); // connecting to db

const auth = require("./middlewares/auth"); // auth middleware

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

const classes = {};

io.on("connection", (socket) => {
	socket.on("clsStarted", (data) => {
		console.log(data.clsId);
		socket.userId = data.clsId;

		classes[data.clsId] = socket.id;

		console.log(classes);
		// socket.id = data.clsId;
		// console.log('sId : ',socket.id + ' cId : ' ,data.clsId + ' uId : ' ,socket.userId )
		socket.emit("me", socket.userId);
	});

	// socket.emit("me", socket.id)

	socket.on("disconnect", () => {
		socket.broadcast.emit("callEnded");
	});

	socket.on("callUser", (data) => {
		let sendTo = classes[data.userToCall];

		io.to(sendTo).emit("callUser", {
			signal: data.signalData,
			from: data.from,
			name: data.name,
		});
	});

	socket.on("answerCall", (data) => {
		let sendTo = classes[data.to];

		io.to(sendTo).emit("callAccepted", data.signal);
	});
});

server.listen(5000, () => console.log("server is running on port 5000"));
