const Membership = require('./../models/membershipModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const filterObj = require('./../utils/filterObj');

exports.getAllMemberships = catchAsync(async (req, res, next) => {
    let filter = {};

    // Execute the query
    const features = new APIFeatures(
        Membership.find(filter).populate({
            path: 'member type',
            select: '-tokens -createdAt -updatedAt -__v',
        }),
        req.query
    )
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const memberships = await features.query;

    res.status(201).json({
        status: 'success',
        data: {
            memberships,
        },
    });
});

exports.getMembership = catchAsync(async (req, res, next) => {
    const membership = await Membership.findById(req.params.id).populate({
        path: 'member type',
        select: '-tokens -createdAt -updatedAt -__v',
    });

    if (!membership) {
        return next(new AppError('No membership found with that ID', 404));
    }

    res.status(201).json({
        status: 'success',
        data: {
            membership,
        },
    });
});

exports.createMembership = catchAsync(async (req, res, next) => {
    // Filter field names that are allowed
    const filteredBody = filterObj(
        req.body,
        'type',
        'amount',
        'expiresAt',
        'member'
    );

    const membership = await Membership.create({
        ...filteredBody,
    });

    res.status(201).json({
        status: 'success',
        data: {
            membership,
        },
    });
});

exports.updateMembership = catchAsync(async (req, res, next) => {
    // Filter field names that are allowed
    const filteredBody = filterObj(
        req.body,
        'type',
        'amount',
        'expiresAt',
        'member'
    );

    const membership = await Membership.findOneAndUpdate(
        {
            _id: req.params.id,
        },
        filteredBody,
        {
            new: true,
            runValidators: true,
        }
    );

    if (!membership) {
        return next(new AppError('No membership found with that ID', 404));
    }

    res.status(201).json({
        status: 'success',
        data: {
            membership,
        },
    });
});

exports.deleteMembership = catchAsync(async (req, res, next) => {
    const membership = await Membership.findOneAndDelete({
        _id: req.params.id,
    });

    if (!membership) {
        return next(new AppError('No membership found with that ID', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null,
    });
});
