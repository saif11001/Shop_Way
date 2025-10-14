require('dotenv').config()
const express = require('express');
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");

const sequelize = require('./config/DB');
require('./models/associations');
const httpStatusText = require('./utils/httpStatusText');
const initDefaultCategory = require("./utils/initDefaultCategory");
const logger = require("./utils/logger");

const PORT = process.env.PORT || 6060;

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: ["http://localhost:3000", "https://your-frontend-domain.com"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));
app.use(helmet());
app.use("/uploads", express.static("uploads"));

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const categoryRoutes = require('./routes/category');
const productRoutes = require('./routes/product');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/order');

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/product', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/order', orderRoutes);

app.use((error, req, res, next) => {
    console.error(error, "Unhandled error occurred");
    const statusCode = error.statusCode || 500;
    const status = statusCode.toString().startsWith("4") ? "fail" : "error";
    res.status(statusCode).json({
        status: status,
        message: error.message || "Internal Server Error"
    });
});

(async() => {
    try {
        await sequelize.authenticate();
        logger.info("Database connected successfully!");

        await sequelize.sync({ alter: true }); 
            logger.info("All models were synchronized successfully.");

            await initDefaultCategory();
            
            app.listen(PORT, () => {
                logger.info(`Server running at http://localhost:${PORT}`
            );

        });
        
    } catch (error) {
        logger.info('Database connection failed: ', error);
        process.exit(1);
    }
})();