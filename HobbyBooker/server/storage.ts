import { users, type User, type InsertUser, bookings, type Booking, type InsertBooking, stats, type Stats } from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";
import { DateTime } from "luxon";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Booking methods
  getBooking(id: number): Promise<Booking | undefined>;
  getBookingsByDate(date: string): Promise<Booking[]>;
  getBookingsByDateRange(startDate: string, endDate: string): Promise<Booking[]>;
  getRecentBookings(limit: number): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: number, booking: Partial<InsertBooking>): Promise<Booking | undefined>;
  deleteBooking(id: number): Promise<boolean>;
  
  // Stats methods
  getStats(): Promise<Stats>;
  updateStats(): Promise<Stats>;
  
  // Auth
  sessionStore: any; // session store implementation
}

export class MemStorage implements IStorage {
  users: Map<number, User>;
  bookings: Map<number, Booking>;
  private statsData: Stats;
  public sessionStore: any;
  currentUserId: number;
  currentBookingId: number;

  constructor() {
    this.users = new Map();
    this.bookings = new Map();
    this.currentUserId = 1;
    this.currentBookingId = 1;
    
    // Initialize with default admin user - plain password for simplicity in development
    const adminUser: User = {
      id: this.currentUserId++,
      username: "admin",
      password: "admin123", // Plain text for development only
      name: "مدير النظام",
      role: "admin"
    };
    this.users.set(adminUser.id, adminUser);
    
    // Initialize with default stats
    this.statsData = {
      id: 1,
      todayBookings: 0,
      totalPayments: 0,
      weekBookings: 0,
      totalTenants: 0,
      lastUpdated: new Date()
    };
    
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role || 'user' // Default role if not provided
    };
    this.users.set(id, user);
    return user;
  }
  
  // Booking methods
  async getBooking(id: number): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }
  
  async getBookingsByDate(date: string): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(
      (booking) => booking.date === date
    );
  }
  
  async getBookingsByDateRange(startDate: string, endDate: string): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(
      (booking) => booking.date >= startDate && booking.date <= endDate
    );
  }
  
  async getRecentBookings(limit: number): Promise<Booking[]> {
    return Array.from(this.bookings.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
  
  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = this.currentBookingId++;
    const booking: Booking = { 
      ...insertBooking, 
      id, 
      createdAt: new Date(),
      paid: insertBooking.paid ?? 0,
      remaining: insertBooking.remaining ?? 0,
      peopleCount: insertBooking.peopleCount ?? 1,
      notes: insertBooking.notes ?? null
    };
    this.bookings.set(id, booking);
    await this.updateStats();
    return booking;
  }
  
  async updateBooking(id: number, booking: Partial<InsertBooking>): Promise<Booking | undefined> {
    const existingBooking = this.bookings.get(id);
    if (!existingBooking) return undefined;
    
    const updatedBooking = { ...existingBooking, ...booking };
    this.bookings.set(id, updatedBooking);
    await this.updateStats();
    return updatedBooking;
  }
  
  async deleteBooking(id: number): Promise<boolean> {
    const result = this.bookings.delete(id);
    if (result) {
      await this.updateStats();
    }
    return result;
  }
  
  // Stats methods
  async getStats(): Promise<Stats> {
    return this.statsData;
  }
  
  async updateStats(): Promise<Stats> {
    const now = DateTime.now();
    const today = now.toISODate() as string;
    const startOfWeek = now.startOf('week').toISODate() as string;
    const endOfWeek = now.endOf('week').toISODate() as string;
    
    // Calculate today's bookings
    const todayBookings = (await this.getBookingsByDate(today)).length;
    
    // Calculate week bookings
    const weekBookings = (await this.getBookingsByDateRange(startOfWeek, endOfWeek)).length;
    
    // Calculate total payments
    const allBookings = Array.from(this.bookings.values());
    const totalPayments = allBookings.reduce((sum, booking) => sum + booking.paid, 0);
    
    // Calculate unique tenants
    const uniqueTenants = new Set();
    allBookings.forEach(booking => uniqueTenants.add(booking.phoneNumber));
    const totalTenants = uniqueTenants.size;
    
    // Update stats
    this.statsData = {
      ...this.statsData,
      todayBookings,
      totalPayments,
      weekBookings,
      totalTenants,
      lastUpdated: new Date()
    };
    
    return this.statsData;
  }
}

export const storage = new MemStorage();
