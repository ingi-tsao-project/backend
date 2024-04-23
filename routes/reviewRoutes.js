const express = require("express");
const reviewController = require("../controllers/reviewController");
const authController = require("../controllers/authController");

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route("/")
  .get(reviewController.getAllReviews)
  .post(
    authController.restrict("user"),
    reviewController.setIds,
    reviewController.createReview,
  );

//Handling a post review with a nested route
router
  .route("/:id")
  .get(reviewController.getReview)
  .patch(
    authController.restrict("user", "admin"),
    reviewController.updateReview,
  )
  .delete(
    authController.restrict("user", "admin"),
    reviewController.deleteReview,
  );

module.exports = router;
