const mongoose = require('mongoose');

const membershipTypeSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Title is required'],
        },
        amount: {
            type: Number,
            required: [true, 'Amount is required'],
        },
        stripeId: {
            type: String,
            required: [true, 'Stripe ID is required'],
        },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

const MembershipType = mongoose.model('MembershipType', membershipTypeSchema);

module.exports = MembershipType;
