const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema(
    {
        type: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MembershipType',
            required: [true, 'Type is required'],
        },
        amount: {
            type: Number,
            required: [true, 'Amount is required'],
        },
        expiresAt: {
            type: Date,
            required: [true, 'Expiration date is required'],
            default: new Date().setFullYear(new Date().getFullYear() + 1),
        },
        member: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Populate relational fields
membershipSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'member',
        select: 'username',
    });
    next();
});

membershipSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'type',
        select: 'title',
    });
    next();
});

const Membership = mongoose.model('Membership', membershipSchema);

module.exports = Membership;
