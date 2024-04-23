const fs = require("fs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Tour = require("../models/tourModel");
const User = require("../models/userModel");
const Review = require("../models/reviewModel");

dotenv.config({ path: "../config.env" });

const DB = process.env.DATABASE.replace("<PASSWORD>", process.env.PASSWORD_DB);

mongoose
  .connect(DB)
  .then(() => {
    //console.log(con.connection);
    console.log("DB connection succesful!");
  })
  .catch((err) => {
    console.log(err);
  });

//READ JSON FILE
const tours = JSON.parse(fs.readFileSync("./data/tours.json", "utf-8"));
const users = JSON.parse(fs.readFileSync("./data/users.json", "utf-8"));
const reviews = JSON.parse(fs.readFileSync("./data/reviews.json", "utf-8"));

//IMPORT DATA INTO DB
// eslint-disable-next-line no-unused-vars
const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log("Data loaded succesfuly!");
  } catch (err) {
    console.log("Error, data doesn't loaded!");
    console.log(err);
  }
};

//DELETE ALL DATA FROM DB
// eslint-disable-next-line no-unused-vars
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log("Documents deleted succesfuly!");
  } catch (err) {
    console.log("Error, data doesn't deleted!");
    console.log(err);
  }
};

importData();
//deleteData();

//Comandos!!!
//cd ./dev-data
//node importing-data.js
