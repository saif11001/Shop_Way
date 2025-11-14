const fs = require('fs').promises;
const path = require('path');
const { Op } = require('sequelize');
const Product = require('../models/product');
const httpStatusText = require('../utils/httpStatusText');

const getProducts = async (req, res, next) => {

    const { page = 1, limit = 5, sort = "createdAt", search } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    if (search) {
        if (!isNaN(search)) {
            whereClause = { price: { [Op.gte]: parseFloat(search) } };
        } else {
            whereClause = {
            [Op.or]: [
                { title: { [Op.like]: `%${search}%` } },
                { brand: { [Op.like]: `%${search}%` } }
            ]
            };
        }
    }

    try{
        const { rows: products, count: totalProducts } = await Product.findAndCountAll({
            where: whereClause,
            order: [[sort, "ASC"]],
            limit: parseInt(limit),
            offset: parseInt(offset),
        });

        if (products.length <= 0) {
            return res.status(200).json({ status: httpStatusText.FAIL, message: "No products found.", data: { products: [] } });
        }
        const totalPages = Math.ceil(totalProducts / limit);
    
        res.status(200).json({
            status: httpStatusText.SUCCESS,
            message: 'Successful collection of products.',
            data: {
                products,
                pagination: {
                    totalProducts,
                    totalPages,
                    currentPage: parseInt(page),
                }
            }
        });

    } catch (error) {
        next(error);
    }
};

const getProduct = async (req, res, next) => {
    const productId = req.params.id;
    try{
        const product = await Product.findByPk(productId);
        if(!product) {
            return res.status(404).json({ status: httpStatusText.FAIL, message: 'Product not found !' })
        }
        res.status(200).json({ status: httpStatusText.SUCCESS, message: 'The product has been fetched successfully.', data: { product } });
    } catch (error) {
        next(error);
    }
};

const addProduct = async (req, res, next) => {
    const { title, price, short_description, long_description, brand, status, quantity, categoryId } = req.body;
    const userId = req.user.id;
    try{
        const product = await Product.create({
            title: title,
            price: price,
            short_description: short_description,
            long_description: long_description,
            brand: brand,
            status: status,
            quantity: quantity,
            UserId: userId,
            CategoryId: categoryId,
            image: req.file ? req.file.path : null
        });
        res.status(201).json({ status: httpStatusText.SUCCESS, message: 'Add Product successfully.', data: { product } });

    } catch (error) {
        next(error);
    }
};

const updateProduct = async (req, res, next) => {
    const userId = req.user.id;
    const productId = req.params.id;
    const { title, price, short_description, long_description, brand, status, quantity, categoryId } = req.body;
    try{
        const product = await Product.findByPk(productId);
        if(!product) {
            return res.status(404).json({ status: httpStatusText.FAIL, message: 'Product not found !' });
        }
        if(product.UserId !== userId) {
            return res.status(403).json({ status: httpStatusText.FAIL, message: 'You are not authorized to update this product.' });
        }

        if(title){product.title = title};
        if(price){product.price = price};
        if(short_description){product.short_description = short_description};
        if(long_description){product.long_description = long_description};
        if(brand){product.brand = brand};
        if(status){product.status = status};
        if(quantity){product.quantity = quantity};
        if(categoryId){product.CategoryId = categoryId};
        if (req.file) {
            if (product.image) {
                const imagePath = path.join(__dirname, '..', product.image);
                await fs.unlink(imagePath, (err) => {
                    if (err) {
                        console.error('Error deleting old image:', err);
                    }
                });
            }
            product.image = req.file.path
        };
        
        await product.save();
        res.status(200).json({ status: httpStatusText.SUCCESS, message: 'Update category successfully.', data: { product } });

    } catch (error) {
        next(error);
    }
};

const deleteProduct = async (req, res, next) => {
    const userId = req.user.id;
    const productId = req.params.id;
    try{
        const product = await Product.findByPk(productId);
        if(!product) {
            return res.status(404).json({ status: httpStatusText.FAIL, message: 'Product not found !' });
        }
        if(userId !== product.UserId) {
            return res.status(403).json({ status: httpStatusText.FAIL, message: 'You are not authorized to delete this product.' });
        }
        if (product.image) {
            const imagePath = path.join(__dirname, '..', product.image); 
            await fs.unlink(imagePath);
        }
        
        await product.destroy();
        res.status(200).json({ status: httpStatusText.SUCCESS, message: 'Delete product successfully.' });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProducts,
    getProduct,
    addProduct,
    updateProduct,
    deleteProduct
}