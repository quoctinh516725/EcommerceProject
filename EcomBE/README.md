# Ecommerce Backend API

Backend API cho hệ thống thương mại điện tử đa người bán (Marketplace).

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** SQL Server (Prisma ORM)
- **Cache:** Redis (ioredis)
- **Authentication:** JWT (Access + Refresh Token)

## Cấu trúc dự án

```
EcomBE/
├── src/
│   ├── config/          # Cấu hình (database, redis, env...)
│   ├── controllers/     # Controller layer
│   ├── services/        # Service layer (business logic)
│   ├── repositories/    # Repository layer (database queries)
│   ├── middlewares/     # Custom middlewares
│   ├── routes/          # Route definitions
│   ├── utils/           # Helper functions
│   ├── errors/          # Custom error classes
│   ├── types/           # TypeScript types
│   ├── validators/      # Validation schemas
│   ├── app.ts           # Express app setup
│   └── server.ts        # Entry point
├── prisma/
│   └── schema.prisma    # Prisma schema
└── package.json
```

## Setup

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình môi trường

Tạo file `.env` với các biến sau:

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=sqlserver://localhost:1433;database=ecommerce;user=sa;password=your_password;encrypt=true

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_ACCESS_SECRET=your_access_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_key_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Cloudinary (optional)
CLOUDINARY_URL=

# VNPay (optional)
VNPAY_TMN_CODE=
VNPAY_HASH_SECRET=

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### 3. Setup Prisma

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations (sau khi có schema)
npm run prisma:migrate
```

### 4. Chạy dự án

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

## Scripts

- `npm run dev` - Chạy server ở chế độ development với hot reload
- `npm run build` - Build TypeScript sang JavaScript
- `npm start` - Chạy server production
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Chạy database migrations
- `npm run prisma:studio` - Mở Prisma Studio

## API Endpoints

### Health Check
- `GET /health` - Kiểm tra trạng thái server

## Lưu ý

- Đảm bảo SQL Server và Redis đang chạy trước khi start server
- Các biến môi trường bắt buộc: `DATABASE_URL`, `REDIS_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`

