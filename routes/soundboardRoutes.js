const express = require('express');
const soundboardController = require('../controllers/soundboardController');
const authController = require('../controllers/authController');

const router = express.Router();

// Routes for uploading / deleting sounds
router.post(
  '/upload',
  authController.protect,
  soundboardController.uploadFiles,
  soundboardController.uploadSound,
  soundboardController.sendGcsUrl
);

router.post('/delete', authController.protect, soundboardController.deleteSound);

// Routes for soundboards
router.route('/mine')
  .get(authController.protect, soundboardController.getAllMySoundboards)

router
  .route('/my/:id')
  .get(authController.protect, soundboardController.getMySoundboard)
  .patch(
    authController.protect,
    soundboardController.createSprite,
    soundboardController.deleteLocalFiles,
    soundboardController.updateMySoundboard
  ).delete(authController.protect, soundboardController.deleteMySoundboard);

router.route('/:id').get(soundboardController.getSoundboard);

router
  .route('/')
  .post(
    authController.protect,
    soundboardController.createSprite,
    soundboardController.deleteLocalFiles,
    soundboardController.createSoundboard
  );

module.exports = router;
