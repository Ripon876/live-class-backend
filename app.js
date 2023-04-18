require('dotenv').config();
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
    origin: process.env.FRONTEND_BASE_URL,
    methods: ["GET", "POST"],
  },
});

// models
const User = require("./models/user");
const Class = require("./models/class");

// cors
const whitelist = [process.env.FRONTEND_BASE_URL];
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
// app.use("*", cors());
app.use(express.json({ limit: "10mb" }));

// mongodb connection
const dbConnect = require("./db/dbConnect");
dbConnect(); // connecting to db

// auth middleware

//  routes
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
let online = [];

let watcher;

const { HelperRoutes } = require("./routes/helper");

HelperRoutes(app, io);

const checkAllClass = async (socket) => {
  try {
    let classes = await Class.find({
      status: "Not Started",
    });
    if (classes.length === 0) {
      watcher = null;
      console.log("stoping watcher");
      socket.broadcast.emit("allClsTaken");
    }
  } catch (err) {
    console.log(err);
  }
};

const startWatcher = async (data) => {
  const Watcher_V2 = require("./watcher-version2");
  let exams = await Class.find({});

  const clearStates = () => {
    online = [];
    io.sockets.emit("examsStates", online);
    watcher = null;
  };
  watcher = new Watcher_V2(exams, io, users, data, clearStates);
  console.log("starting exams");
  watcher.start();
  return;
};

// socket handler
const { SocketHanlder } = require("./socket");
SocketHanlder(io, users, online, watcher, startWatcher);

// server listening
server.listen(PORT, () => console.log("server is running on port ", PORT));
