const express = require("express");
const tourController = require("../controllers/tourControllers");
const authController = require("../controllers/authController");
const reviewRouter = require("./reviewRoutes");

const router = express.Router();

//Aliasing
router
  .route("/top-5-cheap")
  .get(tourController.aliasTopTours, tourController.getAllTours);

//Pipelines | Stats
router.route("/stats").get(tourController.getTourStats);
router.route("/plans/:year").get(tourController.getMonthlyPlan);

router
  .route("/within/:distance/center/:latlng/:unit")
  .get(tourController.getToursWithin);

router.route("/distances/:latlng/unit/:unit").get(tourController.getDistances);

// Handling routes for accessing all tours and creating a new tour
router
  .route("/")
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrict("admin", "lead-guide"),
    tourController.createTour,
  );

// Handling routes for accessing a specific tour by ID, updating, and deleting the tour
router
  .route("/:id")
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrict("admin", "lead-guide"),
    tourController.updateTour,
  )
  .delete(
    authController.protect,
    authController.restrict("admin", "lead-guide"),
    tourController.deleteTour,
  );

router.use("/:tourId/reviews", reviewRouter);

// Exporting the router for use in other modules
module.exports = router;
