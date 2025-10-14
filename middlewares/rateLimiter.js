const rateLimit = require("express-rate-limit");
const httpStatusText = require("../utils/httpStatusText");

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    handler: (req, res) => {
        res.status(429).json({
        status: httpStatusText.FAIL,
        message: "Too many requests, please try again later."
        });
    }
});

const productCategoryLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 8,
    handler: (req, res) => {
        res.status(429).json({
        status: httpStatusText.FAIL,
        message: "Too many requests for product/category actions, please try again later."
        });
    }
});

module.exports = {
    authLimiter,
    productCategoryLimiter
};