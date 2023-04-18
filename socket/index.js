const User = require("../models/user");
const Class = require("../models/class");

exports.SocketHanlder = (io, users, online, watcher) => {
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
};
