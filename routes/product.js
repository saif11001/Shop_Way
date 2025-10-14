const express = require('express');

const productController = require('../controllers/product');
const verifyToken = require('../middlewares/verifyToken');
const allowedTo = require('../middlewares/allowedTo');
const userRole = require('../utils/userRole');
const validate = require('../middlewares/validate/validateProduct');
const handleValidationErrors = require('../middlewares/validate/handleValidationErrors');
const { productCategoryLimiter } = require('../middlewares/rateLimiter');
const upload = require('../middlewares/upload');

const router = express.Router();

router.get('/',
    productController.getProducts
);

router.get('/:id',
    productController.getProduct
);

router.post('/',
    verifyToken,
    allowedTo(userRole.MANAGER),
    validate.add_Product,
    handleValidationErrors,
    productCategoryLimiter,
    upload.single('image'),
    productController.addProduct
);

router.put('/:id',
    verifyToken,
    allowedTo(userRole.MANAGER),
    validate.update_Product,
    handleValidationErrors,
    productCategoryLimiter,
    upload.single('image'),
    productController.updateProduct
);

router.delete('/:id',
    verifyToken,
    allowedTo(userRole.MANAGER),
    productController.deleteProduct
);

module.exports = router;