const Review = require("../models/reviewModel");
const factory = require("./handlerFactory");

exports.setIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.getAllReviews = factory.getAll(Review);

exports.getReview = factory.getOne(Review);

// Controller function for handling requests to create a review
exports.createReview = factory.createOne(Review);

// Controller function for handling requests to update a user
exports.updateReview = factory.updateOne(Review);

// Controller function for handling requests to delete a review
exports.deleteReview = factory.deleteOne(Review);
