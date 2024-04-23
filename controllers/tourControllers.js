const Tour = require("../models/tourModel");
const catchAsync = require("../utils/catchAsync");
const factory = require("./handlerFactory");
const AppError = require("./errorController");

//Controller functions for handling requests to get 5 cheap tours
exports.aliasTopTours = (req, res, next) => {
  console.log("owo");
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";
  next();
};

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 3 } },
    },
    {
      $group: {
        _id: { $toUpper: "$difficulty" },
        numTours: { $sum: 1 },
        numRating: { $sum: "$ratingsQuantity" },
        avgRating: { $avg: "$ratingsAverage" },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    {
      $match: { _id: { $ne: "EASY" } },
    },
  ]);
  res.status(200).json({
    status: "success",
    data: {
      stats: stats,
    },
  });
});

//Here we are using THE MONGOOSE PIPELINE
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    {
      $unwind: "$startDates",
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$startDates" },
        numTourStarts: { $sum: 1 },
        tours: { $push: "$name" },
      },
    },
    {
      $addFields: { month: "$_id" },
    },
    {
      $project: { _id: 0 },
    },
    {
      $sort: { numTourStarts: 1 },
    },
    {
      $limit: 12,
    },
  ]);
  res.status(200).json({
    status: "success",
    data: {
      plans: plan,
    },
  });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(",");

  if (!lat || !lng) {
    next(
      new AppError(
        "Please provide latitude and longitude in the format lat,lng",
        400,
      ),
    );
  }
  const radius = unit === "mi" ? distance / 3963.2 : distance / 6378.1;

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });
  console.log(distance, lat, lng, unit);

  res.status(200).json({
    status: "success",
    results: tours.length,
    data: tours,
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(",");

  const multiplier = unit === "mi" ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        "Please provide latitude and longitude in the format lat,lng",
        400,
      ),
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: "distance",
        distancesMultiplier: multiplier,
      },
    },
    {
      $project: {
        distances: { $round: ["$distance", 2] },
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: distances,
  });
});

// Controller function for handling requests to get all tours
exports.getAllTours = factory.getAll(Tour);

// Controller function for handling requests to get a specific tour by ID
exports.getTour = factory.getOne(Tour, { path: "reviews" });

// Controller function for handling requests to create a new tour
exports.createTour = factory.createOne(Tour);

// Controller function for handling requests to update a tour
exports.updateTour = factory.deleteOne(Tour);

// Controller function for handling requests to delete a tour
exports.deleteTour = factory.deleteOne(Tour);
