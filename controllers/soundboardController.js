const path = require('path');
const download = require('download');
const fs = require('fs-extra');
const multer = require('multer');
const audiosprite = require('../utils/audiosprite');
const Soundboard = require('../models/soundboardModel');
const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const filterObj = require('../utils/filterObj');
const gcsHelpers = require('../services/google');

const { storage } = gcsHelpers;

const DEFAULT_BUCKET_NAME = 'wham-uploads';

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype == 'audio/mpeg' || 'audio/wav' || 'audio/wave') {
    cb(null, true);
  } else {
    cb(new AppError('Please upload only mp3 files', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadFiles = upload.any();

exports.deleteSound = catchAsync(async (req, res, next) => {
  if (!req.body.filename) {
    return new AppError('No audio file sent', 400);
  }

  const parts = req.body.filename.split('/');

  const filename = parts.pop();

  if (!filename.includes(req.user.id)) {
    return new AppError('The audio belongs to a different user', 400);
  }

  const bucketName = DEFAULT_BUCKET_NAME;

  await storage.bucket(bucketName).file(filename).delete();

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.uploadSound = catchAsync(async (req, res, next) => {
  if (!req.files) {
    return new AppError('No audio file sent', 400);
  }

  const audioFile = req.files[0];
  const ext = audioFile.mimetype === 'audio/mpeg' ? 'mp3' : 'wav';
  const bucketName = DEFAULT_BUCKET_NAME;
  const bucket = storage.bucket(bucketName);
  const gcsFileName = `user-${req.user.id}-${Date.now()}.${ext}`;
  const file = bucket.file(gcsFileName);

  const stream = file.createWriteStream({
    metadata: {
      contentType: audioFile.mimetype,
    },
  });

  stream.on('error', (err) => {
    audioFile.cloudStorageError = err;
    next(err);
  });

  stream.on('finish', () => {
    audioFile.cloudStorageObject = gcsFileName;

    file.makePublic().then(() => {
      audioFile.gcsUrl = gcsHelpers.getPublicUrl(bucketName, gcsFileName);
      next();
    });
  });

  stream.end(audioFile.buffer);
});

exports.sendGcsUrl = catchAsync(async (req, res, next) => {
  if (!req.files[0].gcsUrl) {
    return new AppError('No audio file sent', 400);
  }

  res.status(201).json({
    status: 'success',
    data: {
      gcsUrl: req.files[0].gcsUrl,
    },
  });
});

exports.createSprite = catchAsync(async (req, res, next) => {
  if (!req.body.data.sounds) {
    return next();
  }

  // Map sound urls to new array
  const audioArray = req.body.data.sounds.map(({ audio }) => ({
    url: audio,
    ext: audio.split('.').pop(),
  }));

  // Download files locally from GCS
  await Promise.all(
    audioArray.map((audio, index) =>
      download(audio.url, `tmp/${req.user.id}`, {
        filename: `${index}.${audio.ext}`,
      })
    )
  );

  // Audiosprite options
  const opts = {
    output: `tmp/${req.user.id}/sprite-user-${req.user.id}-${Date.now()}`,
    export: 'mp3',
    format: 'howler2',
  };

  const files = await fs.readdir(`tmp/${req.user.id}`);

  // Create an array audiosprite will like
  const formatedFiles = files.map((file) => `tmp/${req.user.id}/${file}`);

  // Create audiosprite
  audiosprite(formatedFiles, opts, function (err, obj) {
    if (err) return console.error(err);

    // Add times to request
    req.spriteTimes = obj.sprite;

    // Upload local file to GCS
    const bucketName = DEFAULT_BUCKET_NAME;
    const bucket = storage.bucket(bucketName);
    const gcsFileName = path.basename(obj.src[0]);
    const file = bucket.file(gcsFileName);
    bucket
      .upload(obj.src[0])
      .then(() => file.makePublic())
      .then(() => {
        req.spriteUrl = gcsHelpers.getPublicUrl(bucketName, gcsFileName);
        next();
      });
  });
});

exports.deleteLocalFiles = catchAsync(async (req, res, next) => {
  if (!req.body.data.sounds) {
    return next();
  }
  // Remove tmp upload folder
  fs.removeSync(`tmp/${req.user.id}`);
  next();
});

exports.createSoundboard = catchAsync(async (req, res) => {
  // Filter field names that are allowed
  const filteredBody = filterObj(req.body.data, 'title', 'status', 'sounds');

  // Add sprite to body
  if (req.spriteUrl) {
    filteredBody.sprite = req.spriteUrl;
  }

  // Add sound times to body
  if (req.spriteTimes) {
    filteredBody.sounds = filteredBody.sounds.map((sound, index) => ({
      ...sound,
      times: Object.values(req.spriteTimes)[index],
    }));
  }

  const soundboard = await Soundboard.create({
    ...filteredBody,
    author: req.user.id,
  });

  res.status(201).json({
    status: 'success',
    data: {
      soundboard,
    },
  });
});

exports.getSoundboard = catchAsync(async (req, res, next) => {
  const soundboard = await Soundboard.findOne({
    _id: req.params.id,
    status: { $eq: 'published' },
  });

  if (!soundboard) {
    return next(new AppError('No soundboard found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      soundboard,
    },
  });
});

exports.getAllMySoundboards = catchAsync(async (req, res, next) => {

  const totalSoundboards = await Soundboard.count({ author: req.user.id })

  // Execute the query
  const features = new APIFeatures(
    Soundboard.find({ author: req.user.id }),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const soundboards = await features.query;

  res.status(201).json({
    status: 'success',
    data: {
      soundboards,
      totalSoundboards
    },
  });
});

exports.getMySoundboard = catchAsync(async (req, res, next) => {
  const soundboard = await Soundboard.findOne({
    _id: req.params.id,
    author: req.user.id,
  });

  if (!soundboard) {
    return next(new AppError('No soundboard found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      soundboard,
    },
  });
});

exports.updateMySoundboard = catchAsync(async (req, res, next) => {
  // Filter field names that are allowed
  const filteredBody = filterObj(req.body.data, 'title', 'status', 'sounds');

  // Add sprite to body
  if (req.spriteUrl) {
    filteredBody.sprite = req.spriteUrl;
  }

  // Add sound times to body
  if (req.spriteTimes) {
    filteredBody.sounds = filteredBody.sounds.map((sound, index) => ({
      ...sound,
      times: Object.values(req.spriteTimes)[index],
    }));
  }

  const soundboard = await Soundboard.findOneAndUpdate(
    {
      _id: req.params.id,
      author: req.user.id,
    },
    filteredBody,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!soundboard) {
    return next(new AppError('No soundboard found with that ID', 404));
  }

  res.status(201).json({
    status: 'success',
    data: {
      soundboard,
    },
  });
});

exports.deleteMySoundboard = catchAsync(async (req, res, next) => {
  const soundboard = await Soundboard.findOneAndDelete({
    _id: req.params.id,
    author: req.user._id,
  });

  if (!soundboard) {
    return next(new AppError('No soundboard found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
})
