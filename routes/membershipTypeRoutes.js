const express = require('express');
const membershipTypeController = require('./../controllers/membershipTypeController');
const authController = require('./../controllers/authController');

const router = express.Router();

// Protected routes
router.use(authController.protect);

// Admin routes
router.use(authController.restrictTo('admin'));

router
    .route('/')
    .get(membershipTypeController.getAllMembershipTypes)
    .post(membershipTypeController.createMembershipType);

router
    .route('/:id')
    .get(membershipTypeController.getMembershipType)
    .patch(membershipTypeController.updateMembershipType)
    .delete(membershipTypeController.deleteMembershipType);

module.exports = router;