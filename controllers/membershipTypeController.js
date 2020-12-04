const MembershipType = require('../models/membershipTypeModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const filterObj = require('./../utils/filterObj');

exports.getAllMembershipTypes = catchAsync(async (req, res, next) => {
    let filter = {};

    // Execute the query
    const features = new APIFeatures(MembershipType.find(filter), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const membershipTypes = await features.query;

    res.status(201).json({
        status: 'success',
        data: {
            membershipTypes,
        },
    });
});

exports.getMembershipType = catchAsync(async (req, res, next) => {
    const membershipType = await MembershipType.findById(req.params.id);

    if (!membershipType) {
        return next(new AppError('No membership type found with that ID', 404));
    }

    res.status(201).json({
        status: 'success',
        data: {
            membershipType,
        },
    });
});

exports.createMembershipType = catchAsync(async (req, res, next) => {
    // Filter field names that are allowed
    const filteredBody = filterObj(req.body, 'title', 'amount', 'stripeId');

    const membershipType = await MembershipType.create({
        ...filteredBody,
    });

    res.status(201).json({
        status: 'success',
        data: {
            membershipType,
        },
    });
});

exports.updateMembershipType = catchAsync(async (req, res, next) => {
    // Filter field names that are allowed
    const filteredBody = filterObj(req.body, 'title', 'amount', 'stripeId');

    const membershipType = await MembershipType.findOneAndUpdate(
        {
            _id: req.params.id,
        },
        filteredBody,
        {
            new: true,
            runValidators: true,
        }
    );

    if (!membershipType) {
        return next(new AppError('No membership type found with that ID', 404));
    }

    res.status(201).json({
        status: 'success',
        data: {
            membershipType,
        },
    });
});

exports.deleteMembershipType = catchAsync(async (req, res, next) => {
    const membershipType = await MembershipType.findOneAndDelete({
        _id: req.params.id,
    });

    if (!membershipType) {
        return next(new AppError('No membership type found with that ID', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null,
    });
});
