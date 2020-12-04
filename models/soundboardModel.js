const mongoose = require('mongoose');

const isPublished = () => {
  if (this.status === 'published') {
    return true;
  }
  return false;
}

const sound = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
  },
  times: { type: [Number], required: [true, 'A sound must have times'] },
  audio: {
    type: String,
    required: [true, 'A sound must have an audio file'],
  },
  useEmoji: {
    type: Boolean,
    default: true,
  },
  emojiId: {
    type: String,
    default: '',
  },
  emojiSkin: {
    type: String,
    default: '1',
  },
  emojiNative: {
    type: String,
    default: '',
  },
  uid: {
    type: String,
  },
  custom: {
    type: Boolean,
    default: false
  }
});

const soundboardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please enter a title'],
      default: 'My new soundboard',
    },
    status: {
      type: String,
      required: [true, 'A soundboard must have a status'],
      enum: {
        values: ['published', 'drafted', 'archived'],
        message: 'Status is either: published, drafted, archived',
      },
      default: 'drafted',
    },
    sounds: [sound],
    sprite: {
      type: String,
      required: [true, 'A soundboard must have a sprite file'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Populate relational fields
soundboardSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'authors',
    select: '_id',
  });
  next();
});

const Soundboard = mongoose.model('Soundboard', soundboardSchema);

module.exports = Soundboard;
