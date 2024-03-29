const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const Class = require("../models/class");

exports.RegisterStudent = async (req, res) => {
  res.status(201).json({
    message:
      "New Student Registration is disabled in  view only mode for security reasons",
  });
  return;

  try {
    await User.findOne({ email: req.body.email }).then((user) => {
      if (!user) {
        bcrypt
          .hash(req.body.password, 10)
          .then((hashedPassword) => {
            const user = new User({
              name: req.body.name,
              email: req.body.email,
              password: hashedPassword,
            });
            user
              .save()
              .then(async (user) => {
                let exams = await Class.find({}).select([
                  "students",
                  "hasToJoin",
                  "-_id",
                ]);

                if (exams.length > 0) {
                  exams[0].students.push(user._id);
                  exams[0].hasToJoin++;

                  await Class.updateMany(
                    {
                      status: "Not Started",
                    },
                    exams[0]
                  );
                }

                res.status(201).json({
                  message: "User Created Successfully",
                  user,
                });
              })
              .catch((error) => {
                console.log(error);
                res.status(500).json({
                  message: "Error creating acount",
                  error,
                });
              });
          })
          .catch((e) => {
            res.status(500).json({
              message: "Password was not hashed successfully",
              e,
            });
          });
      } else {
        res.status(500).json({
          message: "Email Exist",
        });
      }
    });
  } catch (err) {
    console.log(err);
  }
};

exports.LoginUsers = async (req, res) => {
  User.findOne({ email: req.body.email })
    .then((user) => {
      bcrypt
        .compare(req.body.password, user.password)
        .then((passwordCheck) => {
          if (!passwordCheck) {
            return res.status(400).send({
              message: "Passwords does not match",
              error,
            });
          }

          const token = jwt.sign(
            {
              id: user._id,
              name: user.name,
              type: user.type,
            },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
          );
          res.status(200).send({
            message: "Login Successful",
            email: user.email,
            type: user.type,
            token,
          });
        })
        .catch((error) => {
          res.status(400).send({
            message: "Passwords does not match",
            error,
          });
        });
    })
    .catch((e) => {
      res.status(404).send({
        message: "Email not found",
        e,
      });
    });
};
