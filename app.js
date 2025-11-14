const express = require('express');
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");

const sequelize = require('./config/DB');
const { port } = require('./config/index');
require('./models/associations');
const initDefaultCategory = require("./utils/initDefaultCategory");
const logger = require("./utils/logger");

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

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/category', categoryRoutes);
app.use('/api/v1/product', productRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/order', orderRoutes);

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

        await sequelize.sync(); 
            logger.info("All models were synchronized successfully.");

            await initDefaultCategory();
            
            app.listen(port, () => {
                logger.info(`Server running at http://localhost:${port}`
            );

        });
        
    } catch (error) {
        logger.info('Database connection failed: ', error);
        process.exit(1);
    }
})();