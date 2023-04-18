const auth = require("../middlewares/auth");
const Class = require("../models/class");

exports.GetClass = async (req, res) => {
  console.log("calling");
  try {
    const exams = await Class.find({
      hasToJoin: { $gt: 0 },
    }).select(["-students"]);

    let examsToJoin = exams.filter(
      (exam) => exam.roleplayer._id === req.user.id
    );
    console.log(examsToJoin);
    res.status(200).send({
      exams: examsToJoin,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Error getting class",
      error,
    });
  }
};
