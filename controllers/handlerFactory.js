const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const APIFeatures = require("../utils/apiFeatures");

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    //Encontramos el usuario
    const document = await Model.findById(req.params.id);
    //verificamos su existencia
    if (!document) {
      return next(new AppError("No document found with that ID", 404));
    }
    //lo borramos;
    await document.deleteOne();

    //enviamos respuesta
    res.status(204).json({
      status: "success",
      message: "Document has been deleted",
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!document) {
      return next(new AppError("No document found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        document,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    console.log(req.params);
    const newDocument = await Model.create(req.body);

    res.status(201).json({
      status: "success",
      data: {
        newDocument,
      },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = await Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const documents = await query;

    if (!documents) {
      return next(new AppError("No document found with that ID", 404));
    }

    res.status(200).json({
      status: "succes",
      data: {
        documents,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res) => {
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitingFields()
      .pagination();

    //EXECUTE QUERY
    const document = await features.query;

    //SEND RESPONSE
    res.status(200).json({
      status: "success",
      results: document.length,
      data: {
        document,
      },
    });
  });
