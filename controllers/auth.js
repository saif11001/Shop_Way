const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const httpStatusText = require('../utils/httpStatusText');

const register = async (req, res, next) => {
    const { firstName, lastName, email, password, userRole } = req.body;
    try{
        const oldUser = await User.findOne({ where: { email: email }});
        if(oldUser) {
            return res.status(400).json({ status: httpStatusText.FAIL, message: "Email already in use" });
        }
        const hashpassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            firstName: firstName,
            lastName: lastName,
            email: email,
            password: hashpassword,
            userRole: userRole,
            avatar: req.file ? req.file.path : null
        });
        
        const accessToken = jwt.sign({ id: user.id, email: user.email, userRole: user.userRole }, process.env.JWT_SECRET_KEY, { expiresIn: '15m' });
        const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '10d' });

        user.refreshToken = refreshToken;
        await user.save();

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            // secure: true,
            sameSite: "none",
            maxAge: 15 * 60 * 1000,
        })
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            // secure: true,
            sameSite: "none",
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });
        res.status(201).json({
            status: httpStatusText.SUCCESS,
            message: "User registered successfully",
            data: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                userRole: user.userRole,
                avatar: user.avatar
            }});

    } catch (error) {
        next(error);
    }
}

const login = async (req, res, next) => {
    const { email, password } = req.body;
    try{
        const user = await User.findOne({ where: { email: email } });
        if(!user) {
            return res.status(401).json({ status: httpStatusText.FAIL, message: 'A user with this email could not be found.' });
        }
        
        const isEqual = await bcrypt.compare(password, user.password);
        if(!isEqual) {
            return res.status(401).json({ status: httpStatusText.FAIL, message: 'Incorrect password.' });
        }

        const accessToken = jwt.sign({ id: user.id, email: user.email, userRole: user.userRole }, process.env.JWT_SECRET_KEY, { expiresIn: '15m' });
        const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '10d'});

        user.refreshToken = refreshToken;
        await user.save();

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            // secure: true,
            sameSite: "none",
            maxAge: 15 * 60 * 1000,
        })
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            // secure: true,
            sameSite: "none",
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });
        res.status(200).json({
            status: httpStatusText.SUCCESS,
            message: 'User login successfully.',
            data: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                userRole: user.userRole,
                avatar: user.avatar
            }})

    } catch (error) {
        next(error);
    }
}

const logout = async (req, res, next) => {
    const userId = req.user.id;
    try{
        const user = await User.findByPk(userId);
        if(!user) {
            return res.status(404).json({ status: httpStatusText.FAIL, message: 'User not found !' });
        }
        user.refreshToken = null
        await user.save();
        
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        res.status(200).json({ status: httpStatusText.SUCCESS, message: 'Logged out successfully.' })

    } catch (error) {
        next(error);
    }
}

module.exports = {
    register,
    login,
    logout
}