const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const User = require('../models/user');
const httpStatusText = require('../utils/httpStatusText');
const Order = require('../models/order');
const Product = require('../models/product');

const getAllUsers = async(req, res, next) => {
    try{
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const rawLimit = parseInt(req.query.limit, 10) || 4;
        const limit = Math.min(100, Math.max(1, rawLimit));
        const search = (req.query.search || "").toString().trim();
        const offset = (page - 1) * limit;

        const whereClause = search ? {
            [Op.or]: [
                { firstName: { [Op.like]: `%${search}%` } },
                { lastName: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
            ],
        } : {};

        const { rows: users, count: totalUsers } = await User.findAndCountAll({
            where: whereClause,
            offset,
            limit,
            order: [["createdAt", "ASC"]],
            attributes: { exclude: ["password", "refreshToken"] },
        });

        const totalPages = totalUsers === 0 ? 0 : Math.ceil(totalUsers / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1 && totalPages > 0;

        if(users.length <= 0) {
            return res.status(200).json({ status: httpStatusText.FAIL, message: 'Something went wrong. There is no list of usernames.', data: [] });
        }

        return res.status(200).json({
            status: httpStatusText.SUCCESS,
            message: "Users fetched successfully.",
            data: { users },
            pagination: { totalUsers, totalPages, currentPage: page, limit, hasNext, hasPrev }
        });

    } catch (error) {
        next(error);
    }
}

const getUser = async (req, res, next) => {
    const userId = req.user.id;
    try{
        const user = await User.findByPk(userId, { attributes: { exclude: ['password', 'refreshToken'] } });
        if(!user) {
            return res.status(404).json({ status: httpStatusText.FAIL, message: 'User not found !' })
        }
        res.status(200).json({ status: httpStatusText.SUCCESS, message: 'The user was fetched successfully.', data: { user } });
    } catch (error) {
        next(error);
    }
}

const updateUser = async (req, res, next) => {
    const userId = req.user.id;
    const { firstName, lastName, email, password, userRole } = req.body;
    try{
        const user = await User.findByPk(userId);
        if(!user) {
            return res.status(404).json({ status: httpStatusText.FAIL, message: 'User not found !'});
        }
        if(firstName) {user.firstName = firstName}
        if(lastName) {user.lastName = lastName}
        if(email && email !== user.email) {
            const oldUser = await User.findOne({ where: { email: email } });
            if(oldUser) {
                return res.status(400).json({ status: httpStatusText.FAIL, message: 'Email already in use' });
            }
            user.email = email
        }
        if(userRole) {
            if(user.userRole !== 'admin' && userRole === 'admin') {
                return res.status(403).json({ status: httpStatusText.FAIL, message: 'The user role cannot be modified to this privilege.' });
            }
            user.userRole = userRole
        }
        if(password) {
            const isEqual = await bcrypt.compare(password, user.password)
            if(isEqual) {
                return res.status(400).json({ status: httpStatusText.FAIL, message: 'The new password cannot be the same as the old password' });
            }
            const hashpassword = await bcrypt.hash(password, 12);
            user.password = hashpassword;
            user.refreshToken = null;
        }
        if(req.file) {
            if (user.avatar) {
                const oldPath = path.join(__dirname, '..', user.avatar);
                fs.unlink(oldPath, (err) => {
                    if (err) console.error("Error deleting old avatar:", err);
                });
            }
            user.avatar = req.file.path;
        }
        await user.save();
        
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        res.status(200).json({ status: httpStatusText.SUCCESS, message: 'Updated user successfully.' });

    } catch (error) {
        next(error);
    }
}

const deleteUser = async (req, res, next) => {
    const userId = req.user.id;
    try{
        const user = await User.findByPk(userId);
        if(!user) {
            return res.status(404).json({ status: httpStatusText.FAIL, message: 'User not found !' });
        }
        if (user.avatar) {
            const avatarPath = path.join(__dirname, '..', user.avatar);
            fs.unlink(avatarPath, (err) => {
                if (err) console.error("Error deleting avatar:", err);
            });
        }
        if(user.userRole === "user") {
            const order = await Order.findAll({ where: { UserId: userId } });
            if(order.length > 0) {
                return res.status(404).json({ status: httpStatusText.FAIL, message: "You can't delete you information, please try again when your orders are finished." });
            };
            await User.destroy();

        } else if (user.userRole === "manager") {
            await Product.update(
                { status: "inactive" },
                { where: { UserId: userId } }
            );
            await user.destroy();
        } else if (user.userRole === "admin") {
            await user.destroy();
        }

        res.status(200).json({ status: httpStatusText.SUCCESS, message: 'User deleted successfully.' });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getAllUsers,
    getUser,
    updateUser,
    deleteUser
}