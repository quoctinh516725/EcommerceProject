import prisma from "../config/database";
import { Prisma } from "@prisma/client";

export interface CreateProductVariantData {
  productId: string;
  sku: string;
  variantName?: string;
  imageUrl?: string;
  price: string; // Decimal as string
  stock: number;
  weight?: number;
  status?: string;
}

export interface UpdateProductVariantData {
  sku?: string;
  variantName?: string;
  imageUrl?: string;
  price?: string; // Decimal as string
  stock?: number;
  weight?: number;
  status?: string;
}

class ProductVariantRepository {
  async findById(id: string) {
    return prisma.productVariant.findUnique({ where: { id } });
  }

  async findByProductId(productId: string) {
    return prisma.productVariant.findMany({
      where: { productId },
      orderBy: { createdAt: "asc" },
    });
  }

  async create(data: CreateProductVariantData) {
    return prisma.productVariant.create({
      data: {
        productId: data.productId,
        sku: data.sku,
        variantName: data.variantName,
        imageUrl: data.imageUrl,
        price: new Prisma.Decimal(data.price),
        stock: data.stock,
        weight: data.weight,
        status: data.status ?? "ACTIVE",
      },
    });
  }

  async update(id: string, data: UpdateProductVariantData) {
    return prisma.productVariant.update({
      where: { id },
      data: {
        ...data,
        price: data.price ? new Prisma.Decimal(data.price) : undefined,
      },
    });
  }

  async delete(id: string) {
    return prisma.productVariant.delete({ where: { id } });
  }

  async findByIds(ids: string[], select?: Prisma.ProductVariantSelect) {
    return prisma.productVariant.findMany({
      where: { id: { in: ids } },
      select,
    });
  }

  async decrementStock(tx: any, id: string, quantity: number) {
    return (tx as any).productVariant.update({
      where: { id },
      data: {
        stock: { decrement: quantity },
      },
    });
  }

  async incrementStock(tx: any, id: string, quantity: number) {
    return (tx as any).productVariant.update({
      where: { id },
      data: {
        stock: { increment: quantity },
      },
    });
  }
}

export default new ProductVariantRepository();
