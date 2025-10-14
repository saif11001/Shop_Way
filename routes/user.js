const express = require('express');

const userController = require('../controllers/user');
const verifyToken = require('../middlewares/verifyToken');
const allowedTo = require('../middlewares/allowedTo');
const userRole = require('../utils/userRole');
const validate = require('../middlewares/validate/validateUser');
const handleValidationErrors = require('../middlewares/validate/handleValidationErrors');
const rateLimit = require("express-rate-limit");
const { authLimiter } = require('../middlewares/rateLimiter');
const upload = require('../middlewares/upload');

const router = express.Router();

router.get('/all',
    verifyToken,
    allowedTo(userRole.ADMIN),
    userController.getAllUsers
);

router.get('/me',
    verifyToken,
    userController.getUser
);

router.patch('/me',
    verifyToken,
    upload.single('avatar'),
    validate.update_User,
    handleValidationErrors,
    authLimiter,
    userController.updateUser
);

router.delete('/',
    verifyToken,
    userController.deleteUser
);

module.exports = router;