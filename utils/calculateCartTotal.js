function calculateCartTotal(cart) {
    if (!cart || !cart.CartItems) return 0;

    return cart.CartItems.reduce((total, item) => {
        const price = parseFloat(item.Product?.price) || 0;
        const quantity = Number(item.quantity) || 0;
        return total + (price * quantity);
    }, 0);
}

module.exports = calculateCartTotal;