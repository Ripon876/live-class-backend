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
let online = [];

let watcher;

// socket handler
io.on("connection", (socket) => {
  console.log("users connected");
  socket.on("setActive", async (data) => {
    socket.join(data?.id);
    users[data?.id] = socket.id;
    if (watcher) {
      watcher.updateUsers(users);
    }
  });
  socket.on("disconnect", () => {
    console.log("users disconnected");
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
      const cls = await Class.findById(id).select(["-students", "-status"]);

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

  // ===========
  //  admin
  // =============

  socket.on("getExamsStates", (cb) => {
    cb(online);
  });

  socket.on("clearStates", (cb) => {
    online = [];
    cb(online);
  });
});

app.get("/", (req, res) => {
  res.status(200).send({
    serverStatus: "ok",
  });
});

app.post("/get-exam-id", async (req, res) => {
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
    let rooms = await User.findById(req.params.id).select(["rooms", "type"]);

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

    io.sockets.emit("examsStates", online);
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
    io.sockets.emit("examsStates", online);
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

  // await generataList(cls, data.breakAfter, data.breakDuraion);

  console.log("starting exams");
  watcher.start();
  return;
};

// server listening
server.listen(PORT, () => console.log("server is running on port ", PORT));
