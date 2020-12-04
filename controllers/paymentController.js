const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const Membership = require('../models/membershipModel')
const MembershipType = require('../models/membershipTypeModel');
const User = require('../models/userModel')
const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {

    const params = req.params.checkoutData;

    const paramsArray = params.split("-")

    const membershipId = paramsArray[0]

    const customer = paramsArray[1]

    // Get the membership details
    const membershipType = await MembershipType.findById(membershipId);

    // Create the checkout session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        success_url: `${process.env.HOST}`,
        cancel_url: `${process.env.HOST}`,
        customer: customer,
        client_reference_id: membershipType.id,
        line_items: [{ price: membershipType.stripeId, quantity: 1 }],
    })

    // Send to client
    res.status(200).json({
        status: 'success',
        session
    })
})

exports.getCustomerPortal = catchAsync(async (req, res, next) => {
    const session = await stripe.billingPortal.sessions.create({
        customer: req.params.customer,
        return_url: `${process.env.HOST}/profile`,
    });

    // Send to client
    res.status(200).json({
        status: 'success',
        session
    })
})

exports.getNewCustomerId = catchAsync(async (req, res, next) => {
    const customer = await stripe.customers.create({
        email: req.user.email,
    });

    // Save to user in db
    await User.findOneAndUpdate({ email: req.user.email }, { customerId: customer.id })

    res.status(200).json({
        status: 'success',
        customerId: customer.id
    })


})

const createPaymentCheckout = async session => {

    const type = session.client_reference_id
    const amount = session.amount_total
    const member = (await User.findOne({ customerId: session.customer })).id

    await Membership.create({ type, amount, member })

    await User.findOneAndUpdate({ customerId: session.customer }, { role: 'pro' })

}

exports.webhookCheckout = (req, res, next) => {

    const signature = req.headers['stripe-signature']

    let event
    try {
        event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WH_SECRET)

    } catch (error) {
        return res.status(400).send(`Webhook error: ${error.message}`)
    }

    if (event.type === 'checkout.session.completed') {

        console.log("Checkout session completed")

        createPaymentCheckout(event.data.object)

        res.status(200).json({ received: true })
    }

}