const sequelize = require("../config/DB");
const Product = require('../models/product');
const Cart = require('../models/cart');
const CartItem = require('../models/cartItem');
const httpStatusText = require('../utils/httpStatusText');
const formatCart  = require("../utils/cartUtils");

const getCart = async (req, res, next) => {
    try{
        const { formattedCart, totalPrice } = await formatCart(req.user.id);
        if (!formattedCart || totalPrice == 0 ) {
            return res.status(200).json({ status: "success", message: "Your cart is empty", data: [] });
        }

        res.status(200).json({ status: httpStatusText.SUCCESS, message: 'Cart fetched successfully.', data: formattedCart, totalPrice });

    } catch (error) {
        next(error);
    }
}

const addItem = async (req, res, next) => {
    const userId = req.user.id;
    const { productId } = req.body;
    try{
        await sequelize.transaction(async (t) => {
            const product = await Product.findByPk(productId, { transaction: t, lock: t.LOCK.UPDATE });
            if(!product) {
                return res.status(404).json({ status: httpStatusText.FAIL, message: 'Product not found' });
            }

            if(product.quantity <= 0) {
                return res.status(400).json({ status: httpStatusText.FAIL, message: 'Not enough stock' });
            }

            let cart = await Cart.findOne({ where: { UserId: userId }, transaction: t });
            if(!cart) {
                cart = await Cart.create({ UserId: userId }, { transaction: t });
            }
        
            let cartItem = await CartItem.findOne({ where: { CartId: cart.id, ProductId: productId }, transaction: t });
            if(cartItem) {
                cartItem.quantity += 1;
                await cartItem.save({ transaction: t });
            } else {
                cartItem = await CartItem.create({ quantity: 1, CartId: cart.id, ProductId: product.id }, { transaction: t });
            }
        
            product.quantity -= 1;
            await product.save({ transaction: t });

            const { formattedCart, totalPrice } = await formatCart(userId);

            return res.status(201).json({ status: httpStatusText.SUCCESS, message: 'Product added to cart successfully', data: { formattedCart, totalPrice } });
        });
        
    } catch (error) {
        next(error);
    }
}

const updateItem = async (req, res, next) => {
    const userId = req.user.id;
    const { productId, action } = req.body;
    try {
        await sequelize.transaction( async (t) => {

            const cart = await Cart.findOne({ where: { UserId: userId}, transaction: t });
            if (!cart) {
                return res.status(404).json({ status: httpStatusText.FAIL, message: 'Cart not found' });
            }

            const product = await Product.findByPk(productId, { transaction: t, lock: t.LOCK.UPDATE });
            if (!product) {
                return res.status(404).json({ status: httpStatusText.FAIL, message: 'Product not found' });
            }
        
            let cartItem = await CartItem.findOne({ where: { CartId: cart.id, ProductId: productId }, transaction: t });
            if (!cartItem) {
                return res.status(404).json({ status: httpStatusText.FAIL, message: 'Product not found in cart' });
            }

            
            switch (action) {
                case "increment":
                    if (product.quantity <= 0) {
                        return res.status(409).json({ status: httpStatusText.FAIL, message: "Product out of stock" });
                    }
                    cartItem.quantity += 1;
                    await cartItem.save({transaction: t});
                    
                    product.quantity -= 1;
                    await product.save({transaction: t});
                    break;
                    
                case "decrement":
                    cartItem.quantity -= 1;
                    product.quantity += 1;
                    await product.save({transaction: t});
                    
                    if (cartItem.quantity <= 0) {
                        await cartItem.destroy({transaction: t});
                        return res.status(200).json({ status: httpStatusText.SUCCESS, message: "Product removed from cart" });
                    } else {
                        await cartItem.save({transaction: t});
                    }
                break;

                default: return res.status(400).json({ status: httpStatusText.FAIL, message: "Invalid action" });
            } 
            res.status(201).json({ status: httpStatusText.SUCCESS, message: 'Cart updated successfully', data: {cartItem} });
        })
    } catch (error) {
        next(error);
    }
};
        
const deleteItem = async (req, res, next) => {
    const userId = req.user.id;
    const { productId } = req.body;
    try {
        await sequelize.transaction(async (t) => {

            const cart = await Cart.findOne({ where: { UserId: userId}, transaction: t });
            if (!cart) {
                return res.status(404).json({ status: httpStatusText.FAIL, message: 'Cart not found' });
            }

            const product = await Product.findByPk(productId, { transaction: t, lock: t.LOCK.UPDATE});
            if (!product) {
                return res.status(404).json({ status: httpStatusText.FAIL, message: 'Product not found' });
            }
        
            let cartItem = await CartItem.findOne({ where: { CartId: cart.id, ProductId: productId }, transaction: t });
            if (!cartItem) {
                return res.status(404).json({ status: httpStatusText.FAIL, message: 'Product not found in cart' });
            }
        
        product.quantity += cartItem.quantity;
        await product.save({transaction: t});
        await cartItem.destroy({transaction: t});
    });
    return res.status(200).json({ status: httpStatusText.SUCCESS, message: 'Product removed from cart successfully.' });
        
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getCart,
    addItem,
    updateItem,
    deleteItem
}