const User = require("../models/user");
const Class = require("../models/class");
const auth = require("../middlewares/auth");

exports.HelperRoutes = (app, io) => {
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
        res.status(200).send({
          id: classes[firstExamId]?._id.toString(),
        });
      } else if (user?.type === "teacher" || user?.type === "roleplayer") {
        let query = {
          [user?.type + "._id"]: user?.id,
          status: "Not Started",
        };
        let exam = await Class.find(query).select(["_id"]);
        res.status(200).send({
          id: exam[0]?._id?.toString(),
        });
      }
    } catch (err) {
      res.status(500).json({
        message: "something went wring",
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
        message: "something went wring",
        err,
      });
    }
  });

  app.put("/update-user-details", auth, async (req, res) => {
    try {
      // const user = await User.findByIdAndUpdate(req.user.id, req.body, {
      //   new: true,
      // });res.status(200).send({

      res.status(200).send({
        message:
          "Updating profile is disabled in view only mode for security reasons",
      });
    } catch (err) {
      res.status(500).json({
        message: "something went wring",
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
        message: "something went wring",
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
        message: "something went wring",
        err,
      });
    }
  });

  app.post("/markOnline", async (req, res) => {
    try {
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
        message: "something went wring",
        err,
      });
    }
  });

  app.post("/unmarkOnline", async (req, res) => {
    try {
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
        message: "something went wring",
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
        message: "something went wring",
        err,
      });
    }
  });
};
