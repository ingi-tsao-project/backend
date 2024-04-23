const express = require("express");
const authController = require("../controllers/authController");

// Importing the user controller module
const userController = require("../controllers/userControllers");

// Creating an instance of express Router
const router = express.Router();

router.post("/signup", authController.singup);
router.post("/login", authController.login);

router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);

router.use(authController.protect);

router.patch("/updatePassword", authController.updatePassword);
router.get("/me", userController.getMe, userController.getUser);
router.patch("/updateMe", userController.updateMe);
router.delete("/deleteMe", userController.deleteMe);

router.use(authController.restrict("admin"));

// Handling routes for accessing all users and creating a new user
router.route("/").get(userController.getAllUsers);
// Handling routes for accessing a specific user by ID, updating, and deleting the user
router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

// Exporting the userRouter for use in other modules
module.exports = router;
