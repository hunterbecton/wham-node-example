const express = require('express');
const membershipController = require('./../controllers/membershipController');
const authController = require('./../controllers/authController');

const router = express.Router();

// Protected routes below
router.use(authController.protect);

// Admin routes
router.use(authController.restrictTo('admin'));

router
    .route('/')
    .get(membershipController.getAllMemberships)
    .post(membershipController.createMembership);

module.exports = router;