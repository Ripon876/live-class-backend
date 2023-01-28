require("dotenv").config();
const mongoose = require("mongoose");

async function dbConnect() {
 
  mongoose
    .connect(
        process.env.DB_URL || 'mongodb://127.0.0.1:27017' ,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true
      }
    )
    .then(() => {
      console.log("Successfully connected to MongoDB");
    })
    .catch((error) => {
      console.log("Unable to connect to MongoDB");
      console.error(error);
    });
}

module.exports = dbConnect;