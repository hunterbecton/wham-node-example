const express = require('express')
const paymentController = require('../controllers/paymentController')
const authController = require('./../controllers/authController')

const router = express.Router({ mergeParams: true })

router.get('/checkout-session/:checkoutData', authController.protect, paymentController.getCheckoutSession)

router.post('/portal-session/:customer', authController.protect, paymentController.getCustomerPortal)

router.get('/customer', authController.protect, paymentController.getNewCustomerId)

module.exports = router