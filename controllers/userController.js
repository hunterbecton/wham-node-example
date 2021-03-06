const multer = require('multer');
const sharp = require('sharp');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const removeFalsy = require('../utils/removeFalsy')
const filterObj = require('../utils/filterObj');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');
const gcsHelpers = require('../services/google');
const { filter } = require('async');

const { storage } = gcsHelpers;

const DEFAULT_BUCKET_NAME = 'wham-uploads';

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

exports.uploadUserPhotoGCS = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return new AppError('No image file sent', 400);
  }

  const imageFile = req.file;
  const ext = imageFile.mimetype === 'jpg' || 'jpeg' ? 'jpg' : 'png';
  const bucketName = DEFAULT_BUCKET_NAME;
  const bucket = storage.bucket(bucketName);
  const gcsFileName = `profile-user-${req.user.id}-${Date.now()}.${ext}`;
  const file = bucket.file(gcsFileName);

  const stream = file.createWriteStream({
    metadata: {
      contentType: imageFile.mimetype,
    },
  });

  stream.on('error', (err) => {
    imageFile.cloudStorageError = err;
    next(err);
  });

  stream.on('finish', () => {
    imageFile.cloudStorageObject = gcsFileName;

    file.makePublic().then(() => {
      imageFile.gcsUrl = gcsHelpers.getPublicUrl(bucketName, gcsFileName);
      next();
    });
  });

  stream.end(imageFile.buffer);

})

exports.sendGcsUrl = catchAsync(async (req, res, next) => {
  if (!req.file.gcsUrl) {
    return new AppError('No image file sent', 400);
  }

  res.status(201).json({
    status: 'success',
    data: {
      gcsUrl: req.file.gcsUrl,
    },
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.data.password || req.body.data.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates.',
        400
      )
    );
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body.data, 'username', 'email', 'photo');

  const filterEmpty = removeFalsy(filteredBody)

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filterEmpty, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead',
  });
};

exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);

// Do NOT update passwords with this!
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
