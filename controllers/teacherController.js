const Class = require("../models/class");
const Mark = require("../models/mark");

exports.GetClasses = async (req, res) => {
  try {
    const dsfds = await Class.find({});
    const classes = await Class.find({
      hasToJoin: { $gt: 0 },
    }).select(["-students"]);

    let teacherClasses = classes.filter(
      (cla) => cla.teacher._id === req.user.id
    );

    res.status(200).send({
      classes: teacherClasses,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Error getting classes",
      error,
    });
  }
};

exports.GetClass = async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id);

    res.status(200).send({
      cls: cls,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Error getting class",
      err,
    });
  }
};

exports.MarkClassAsOngoing = async (req, res) => {
  try {
    let cls = await Class.findById(req.params.id);
    cls.status = "Ongoing";
    await cls.save();
    res.status(200).send({
      msg: "Marked as Ongoing",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Error creating acount",
      err,
    });
  }
};

exports.SubmitMark = async (req, res) => {
  try {
    let exam = await Class.findById(req.body.eId);
    req.body = {
      ...req.body,
      exam: {
        _id: exam?._id,
        title: exam?.title,
      },
    };
    delete req.body.eId;
    let mark = await new Mark({
      ...req.body,
      date: new Date().toJSON().slice(0, 10),
    });

    await mark.save();
    res.status(200).send({
      msg: "Mark Submited",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Error submiting mark",
      err,
    });
  }
};
