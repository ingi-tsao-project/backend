const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const sendEmail = require("../utils/email");

const signToken = (id) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE_TIME,
  });
  return token;
};

const createSendCode = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);

  //remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.singup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  createSendCode(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //1) Check if email and password exist
  if (!email || !password) {
    next(new AppError("Please provide email and password!", 400));
  }
  //2) Check if user exists and password is correct
  const user = await User.findOne({ email }).select("+password");
  if (!user) return next(new AppError("Email does not exist", 400));
  const validPassord = await user.correctPassword(password, user.password);
  if (!validPassord) return next(new AppError("Invalid password", 400));
  //3) If everything is ok, send the token to client
  createSendCode(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  //1) Getting token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("You are not logged in, please log in to get access", 401),
    );
  }
  //2) Validate the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3) Check if user still exist
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(
      new AppError("The token belogin to this token does no loger exits.", 401),
    );
  }

  //4) Check if user changed password after the token was create issued
  const changed = await freshUser.changedPasswordAfter(decoded.iat);
  if (!changed) {
    return next(
      new AppError("Password was recently changed, Please login again.", 401),
    );
  }
  req.user = freshUser;
  next();
});

exports.restrict =
  (...roles) =>
  (req, res, next) =>
    !roles.includes(req.user.role)
      ? next(new AppError("No eres admin", 403))
      : next();

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("No existe un usuario con ese email", 404));
  }

  //2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  //3) Send it to user's email
  const resetURL = `${req.protocol}://${req.get("host")}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Forgot your password?, Submit a patch request with your new password to: ${resetURL}`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token (valid for 10 min)",
      message,
    });

    res.status(200).json({
      status: "success",
      message: "Token sent to email",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError("There was and error sending the email,Try again later"),
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on the token
  const user = await User.findOne({
    passwordResetToken: crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex"),
    passwordResetExpires: { $gt: Date.now() },
  });

  //2) If token has not expires, and there is user, set the new password
  if (!user) {
    return next(new AppError("Token is invalid", 400));
  }

  //3) Update changedPasswordAt propery for the user
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  //4) Log the user in, send JWT
  createSendCode(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1) Get user from collection
  const { email } = req.user;
  const { actualPassword, password, passwordConfirm } = req.body;
  const user = await User.findOne({ email }).select("+password");
  console.log("ap", actualPassword);
  console.log("up", user.password);
  const validPassword = await user.correctPassword(
    actualPassword,
    user.password,
  );

  if (!validPassword)
    return next(
      new AppError("The actual password is incorrect, please verify it", 401),
    );

  //3) If so, updated password
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  await user.save();

  createSendCode(user, 200, res);
});
