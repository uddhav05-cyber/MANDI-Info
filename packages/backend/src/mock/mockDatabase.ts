/**
 * Mock Database for Demo Mode
 * Simulates database operations without actual database
 */

import { mockProducts, mockVendors, mockUsers, mockCategories } from './mockData';

class MockDatabase {
  private products = [...mockProducts];
  private vendors = [...mockVendors];
  private users = [...mockUsers];
  private categories = [...mockCategories];

  // Product operations
  async findProductById(id: string) {
    return this.products.find(p => p.id === id) || null;
  }

  async findAllProducts() {
    return this.products;
  }

  async createProduct(data: any) {
    const newProduct = {
      id: `product-${Date.now()}`,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.products.push(newProduct);
    return newProduct;
  }

  async updateProduct(id: string, data: any) {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    this.products[index] = {
      ...this.products[index],
      ...data,
      updatedAt: new Date(),
    };
    return this.products[index];
  }

  // Vendor operations
  async findVendorById(id: string) {
    return this.vendors.find(v => v.id === id) || null;
  }

  async findAllVendors() {
    return this.vendors;
  }

  // User operations
  async findUserById(id: string) {
    return this.users.find(u => u.id === id) || null;
  }

  async findUserByPhone(phone: string) {
    return this.users.find(u => u.phoneNumber === phone) || null;
  }

  // Category operations
  async findAllCategories() {
    return this.categories;
  }

  // Test connection
  async testConnection() {
    return true;
  }
}

export const mockDb = new MockDatabase();
