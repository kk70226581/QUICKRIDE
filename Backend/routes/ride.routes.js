const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const rideController = require('../controllers/ride.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/chat-details/:id', rideController.chatDetails)

router.get('/status/:id',
    authMiddleware.authUser,
    rideController.rideStatus
)

router.post('/create',
    authMiddleware.authUser,
    body('pickup').isString().isLength({ min: 3 }).withMessage('Invalid pickup address'),
    body('destination').isString().isLength({ min: 3 }).withMessage('Invalid destination address'),
    body('vehicleType').isString().isIn([ 'auto', 'car', 'bike' ]).withMessage('Invalid vehicle type'),
    rideController.createRide
)

router.get('/get-fare',
    authMiddleware.authUser,
    query('pickup').isString().isLength({ min: 3 }).withMessage('Invalid pickup address'),
    query('destination').isString().isLength({ min: 3 }).withMessage('Invalid destination address'),
    rideController.getFare
)

router.post('/payment/order',
    authMiddleware.authUser,
    body('rideId').optional().isMongoId().withMessage('Invalid ride id'),
    body('pickup').if(body('rideId').not().exists()).isString().isLength({ min: 3 }).withMessage('Invalid pickup address'),
    body('destination').if(body('rideId').not().exists()).isString().isLength({ min: 3 }).withMessage('Invalid destination address'),
    body('vehicleType').if(body('rideId').not().exists()).isString().isIn([ 'auto', 'car', 'bike' ]).withMessage('Invalid vehicle type'),
    rideController.createPaymentOrder
)

router.post('/payment/verify',
    authMiddleware.authUser,
    body('rideId').optional().isMongoId().withMessage('Invalid ride id'),
    body('razorpay_order_id').isString().notEmpty().withMessage('Order id is required'),
    body('razorpay_payment_id').isString().notEmpty().withMessage('Payment id is required'),
    body('razorpay_signature').isString().notEmpty().withMessage('Payment signature is required'),
    rideController.verifyPayment
)

router.post('/confirm',
    authMiddleware.authCaptain,
    body('rideId').isMongoId().withMessage('Invalid ride id'),
    rideController.confirmRide
)


router.get('/cancel',
    query('rideId').isMongoId().withMessage('Invalid ride id'),
    rideController.cancelRide
)


router.get('/start-ride',
    authMiddleware.authCaptain,
    query('rideId').isMongoId().withMessage('Invalid ride id'),
    query('otp').isString().isLength({ min: 6, max: 6 }).withMessage('Invalid OTP'),
    rideController.startRide
)

router.post('/end-ride',
    authMiddleware.authCaptain,
    body('rideId').isMongoId().withMessage('Invalid ride id'),
    rideController.endRide
)


module.exports = router;
