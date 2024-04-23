const dotenv = require("dotenv");
const mongoose = require("mongoose");
const app = require("./app");

dotenv.config({ path: "./config.env" });

process.on("uncaughtException", (err) => {
  console.log("Error name:", err.name, "| Error message:", err.message);
  console.log("Uncaught exception");
  process.exit();
});

const DB = process.env.DATABASE.replace("<PASSWORD>", process.env.PASSWORD_DB);

mongoose
  .connect(DB)
  .then(() => {
    //console.log(con.connection);
    console.log("DB connection succesful!");
    console.log("Todo corriendo mi papacho 👌");
  })
  .catch((err) => {
    console.log(err);
  });

const port = process.env.PORT || 3000;

//console.log(process.env);

const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on("unhandledRejection", (err) => {
  console.log("Error name:", err.name, "| Error message:", err.message);
  console.log("Unhandled rejection! Shutting down");
  server.close(() => {
    process.exit();
  });
});
