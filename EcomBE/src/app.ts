import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middlewares/errorHandler';
import { notFoundHandler } from './middlewares/notFoundHandler';
import authRoutes from './routes/auth.routes';
import { env } from './config/env';
import adminRoutes from './routes/admin.routes';
import profileRoutes from './routes/profile.routes';
import publicRoutes from './routes/public.routes';
import sellerRoutes from './routes/seller.routes';


const app: Express = express();

// Security middleware
app.use(helmet());

// CORS configuration
// Allow all origins for public routes (SEO-friendly)
// For authenticated routes, credentials are required
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // In production, check against allowed origins
      if (env.NODE_ENV === 'production') {
        const allowedOrigins = process.env.FRONTEND_URL
          ? [process.env.FRONTEND_URL]
          : [];
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          // For public routes, allow all origins in production too (SEO)
          callback(null, true);
        }
      } else {
        // In development, allow all origins
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting for authenticated routes only
// Public routes have their own rate limiting (higher limit)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/auth', authLimiter);
app.use('/api/admin', authLimiter);
app.use('/api/profile', authLimiter);
app.use('/api/seller', authLimiter);

// Cookie parser (must be before body parser)
app.use(cookieParser());

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
// Public routes (no authentication required, SEO-friendly)
app.use('/api', publicRoutes);

// Authenticated routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/seller', sellerRoutes);
// 404 handler
app.use(notFoundHandler);

// Error handler 
app.use(errorHandler);

export default app;

