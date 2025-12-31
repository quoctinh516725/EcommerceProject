import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import categoryController from '../controllers/public/category.controller';
import brandController from '../controllers/public/brand.controller';
import productController from '../controllers/public/product.controller';
import shopController from '../controllers/public/shop.controller';
import {
  validatePagination,
  validatePriceRange,
  validateSortBy,
  validateUUID,
} from '../validators/public.validator';

const router = Router();

// Rate limiting for public routes (higher limit than admin routes)
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per 15 minutes per IP
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all public routes
router.use(publicLimiter);

// ==================== CATEGORIES ROUTES ====================
router.get('/categories', categoryController.getCategoryTree);
router.get('/categories/:slug', categoryController.getCategoryBySlug);
router.get('/categories/:id/children', validateUUID('id'), categoryController.getCategoryChildren);

// ==================== BRANDS ROUTES ====================
router.get('/brands', brandController.getAllBrands);
router.get('/brands/:slug', brandController.getBrandBySlug);

// ==================== PRODUCTS ROUTES ====================
// Specific routes must come before parameterized routes to avoid conflicts
router.get(
  '/products',
  validatePagination,
  validatePriceRange,
  validateSortBy,
  productController.searchProducts
);
router.get('/products/all', validatePagination, productController.getAllProducts);
router.get(
  '/products/category/:categoryId',
  validateUUID('categoryId'),
  validatePagination,
  productController.getProductsByCategory
);
router.get(
  '/products/shop/:shopId',
  validateUUID('shopId'),
  validatePagination,
  productController.getProductsByShop
);
// UUID route - validateUUID will pass to next route if not a UUID
router.get('/products/:id', validateUUID('id'), productController.getProductById);
// Slug route - catches non-UUID values (must be last)
router.get('/products/:slug', productController.getProductBySlug);

// ==================== SHOPS ROUTES ====================
router.get('/shops/:id', validateUUID('id'), shopController.getShopById);
router.get(
  '/shops/:id/products',
  validateUUID('id'),
  validatePagination,
  shopController.getShopProducts
);
router.get('/shops/:slug', shopController.getShopBySlug);

export default router;



import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import categoryController from '../controllers/public/category.controller';
import brandController from '../controllers/public/brand.controller';
import productController from '../controllers/public/product.controller';
import shopController from '../controllers/public/shop.controller';
import {
  validatePagination,
  validatePriceRange,
  validateSortBy,
  validateUUID,
} from '../validators/public.validator';

const router = Router();

// Rate limiting for public routes (higher limit than admin routes)
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per 15 minutes per IP
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all public routes
router.use(publicLimiter);

// ==================== CATEGORIES ROUTES ====================
router.get('/categories', categoryController.getCategoryTree);
router.get('/categories/:slug', categoryController.getCategoryBySlug);
router.get('/categories/:id/children', validateUUID('id'), categoryController.getCategoryChildren);

// ==================== BRANDS ROUTES ====================
router.get('/brands', brandController.getAllBrands);
router.get('/brands/:slug', brandController.getBrandBySlug);

// ==================== PRODUCTS ROUTES ====================
// Specific routes must come before parameterized routes to avoid conflicts
router.get(
  '/products',
  validatePagination,
  validatePriceRange,
  validateSortBy,
  productController.searchProducts
);
router.get('/products/all', validatePagination, productController.getAllProducts);
router.get(
  '/products/category/:categoryId',
  validateUUID('categoryId'),
  validatePagination,
  productController.getProductsByCategory
);
router.get(
  '/products/shop/:shopId',
  validateUUID('shopId'),
  validatePagination,
  productController.getProductsByShop
);
// UUID route - validateUUID will pass to next route if not a UUID
router.get('/products/:id', validateUUID('id'), productController.getProductById);
// Slug route - catches non-UUID values (must be last)
router.get('/products/:slug', productController.getProductBySlug);

// ==================== SHOPS ROUTES ====================
router.get('/shops/:id', validateUUID('id'), shopController.getShopById);
router.get('/shops/:slug', shopController.getShopBySlug);
router.get(
  '/shops/:id/products',
  validateUUID('id'),
  validatePagination,
  shopController.getShopProducts
);

export default router;


