# ShopWay

ShopWay is a full-stack **E-commerce API** built with **Node.js, Express and MySQL (Sequelize)**.
It provides authentication **(JWT + refresh tokens in cookies)**, role-based access **(user/manager/admin)**, product & category management, cart & order flows, and image upload support.

---

## Features

- User authentication & authorization (Register, Login, Logout) with **JWT** and refresh tokens stored in DB + HTTP-only cookies.
- Role-based access control: **user, manager, admin**.
- Product CRUD (Add / Update / Delete / View) with image upload support.
- Category CRUD and safe deletion (products moved to default category).
- Shopping cart: add/remove items, update quantity (transactional, stock-aware).
- Orders: checkout (creates order from cart) and list user orders.
- Pagination & search on lists (products, users, categories).
- File upload with **multer**; product images in uploads/products/, user avatars in uploads/users/.
- Input validation using **express-validator** and centralized error handling.
- Rate limiting for sensitive endpoints (auth, product/category actions).
- Security basics: helmet, CORS config, password hashing with bcrypt.
- Structured logging via **pino**.

---

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MySQL (via Sequelize ORM)
- **Authentication:** JWT (access + refresh), bcrypt
- **File Upload:** multer (local disk storage; uploads served via /uploads)
- **Validation:** express-validator
- **Security** & Hardening: helmet, express-rate-limit, cookie-parser, CORS
- **Logging:** pino + pino-pretty
- **Config & Env:** dotenv

---

### Using Postman

**URL for published documentation:** https://documenter.getpostman.com/view/38702841/2sB3WvMxia

---

## Project Structure

![Project Structure](./docs/my_diagram.png)

---

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/saif11001/ShopWay.git
   cd ShopWay
      
2. Install dependencies:
   ```bash
   npm install

3. Create a .env file with the following variables:
   ```bash
   # Database (MySQL)
   DB_NAME=shopway
   DB_USER=root
   DB_PASS=your_db_password
   DB_HOST=localhost
   DB_DIALECT=mysql

   # JWT keys
   JWT_SECRET_KEY=your_long_random_access_secret
   JWT_REFRESH_SECRET=your_long_random_refresh_secret

   # Server
   PORT=6060

   # Optional (frontend origin)
   CLIENT_URL=http://localhost:3000

4. Start the server:
   ```bash
   npm start

---

## Future Improvements

- Admin dashboard (analytics, product/user/order management).
- Add product reviews & ratings.
- Email notifications (order confirmations, password reset).
- Integrate Stripe (or other) for payments and order state transitions (paid, shipped, delivered).
- Move file storage to cloud (AWS S3 / Cloud Storage) for reliability and scalability.
- Add automated tests (unit + integration).

---

## Author

**Saif Eldeen Sobhi**

- LinkedIn: [linkedin.com/in/saif-eldeen-sobhy](https://www.linkedin.com/in/saif-eldeen-sobhy/)  
- Email: saifeldeen409@gmail.com
- Postman: https://documenter.getpostman.com/view/38702841/2sB3WvMxia
