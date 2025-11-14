const jwt = require('jsonwebtoken');
const config = require('../config/index');
const httpStatusText = require('../utils/httpStatusText');
const User = require('../models/user');

const verifyToken = async (req, res, next) => {

    const accessToken = req.cookies.accessToken;
    try{
        if(accessToken) {
            const decoded = jwt.verify(accessToken, config.jwt.accessSecret);
            req.user = decoded;
            return  next();
        }
    }catch (error) {
        if(error.name !== 'TokenExpiredError') {
            return next(error);
        }
    }

    const refreshToken = req.cookies.refreshToken;
    if(!refreshToken) {
        return res.status(401).json({ status: httpStatusText.FAIL, message: "Access token expired and no refresh token available." })
    }
    try{
        const decodedRefreshToken = jwt.verify(refreshToken, config.jwt.refreshSecret);


        const user = await User.findOne({ where: { id: decodedRefreshToken.id } });
        if(!user || user.refreshToken != refreshToken){
            res.clearCookie("accessToken");
            res.clearCookie("refreshToken");
            return res.status(403).json({ status: httpStatusText.FAIL, message: "Invalid refresh token. Please login again." });
        }

        const newAccessToken = jwt.sign({ id: user.id, email: user.email, userRole: user.userRole }, config.jwt.accessSecret, { expiresIn: config.jwt.accessExpiry } );
        const newRefreshToken = jwt.sign({ id: user.id }, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiry });

        user.refreshToken = newRefreshToken;
        await user.save();

        res.cookie("accessToken", newAccessToken, {
            httpOnly: true,
            // secure: true,
            sameSite: "none",
            maxAge: 15 * 60 * 1000,
        })
        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            // secure: true,
            sameSite: "none",
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        req.user = jwt.verify(newAccessToken, config.jwt.accessSecret);
        next();

    } catch (error) {
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        next(error);
    }
}

module.exports = verifyToken;