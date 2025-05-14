import type { Express, Request, Response } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import { fileURLToPath } from 'url';

// Get directory paths in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve static files from public directory
  app.use(express.static(path.join(__dirname, '../client/public')));

  // Get all bookings (formatted for calendar)
  app.get("/api/bookings", async (req, res) => {
    try {
      const allBookings = Array.from(storage.bookings.values());
      
      // Format bookings by date for the calendar
      const bookingsByDate: { [date: string]: { morning?: any; evening?: any } } = {};
      
      allBookings.forEach(booking => {
        if (!bookingsByDate[booking.date]) {
          bookingsByDate[booking.date] = {};
        }
        
        if (booking.period === "morning" || booking.period === "both") {
          bookingsByDate[booking.date].morning = {
            id: booking.id,
            tenantName: booking.tenantName,
            phoneNumber: booking.phoneNumber,
            paid: booking.paid,
            remaining: booking.remaining,
            peopleCount: booking.peopleCount
          };
        }
        
        if (booking.period === "evening" || booking.period === "both") {
          bookingsByDate[booking.date].evening = {
            id: booking.id,
            tenantName: booking.tenantName,
            phoneNumber: booking.phoneNumber,
            paid: booking.paid,
            remaining: booking.remaining,
            peopleCount: booking.peopleCount
          };
        }
      });
      
      res.json(bookingsByDate);
    } catch (error) {
      res.status(500).json({ message: "فشل في استرجاع الحجوزات" });
    }
  });

  // Create a new booking
  app.post("/api/save_booking", async (req, res) => {
    try {
      const { date, period, name, phone, paid, rest, people } = req.body;
      
      // Check if there is already a booking for this date and period
      const existingBookings = await storage.getBookingsByDate(date);
      const conflictingBooking = existingBookings.find(booking => {
        if (period === "both") {
          return ["morning", "evening", "both"].includes(booking.period);
        } else if (period === "morning") {
          return ["morning", "both"].includes(booking.period);
        } else if (period === "evening") {
          return ["evening", "both"].includes(booking.period);
        }
        return false;
      });
      
      if (conflictingBooking) {
        return res.status(409).json({ 
          status: 'error',
          message: "هناك حجز موجود بالفعل في هذا التاريخ والفترة" 
        });
      }
      
      // Create the booking
      const booking = await storage.createBooking({
        date,
        period,
        tenantName: name,
        phoneNumber: phone,
        paid: parseInt(paid) || 0,
        remaining: parseInt(rest) || 0,
        peopleCount: parseInt(people) || 1,
        createdBy: 1 // Default creator ID
      });
      
      res.status(200).json({ status: 'success', booking });
    } catch (error) {
      console.error(error);
      res.status(500).json({ 
        status: 'error',
        message: "فشل في إنشاء الحجز" 
      });
    }
  });

  // Render the main page with bookings data
  app.get("/", async (req, res) => {
    try {
      const allBookings = Array.from(storage.bookings.values());
      
      // Format bookings by date for the calendar
      const bookingsByDate: { [date: string]: { morning?: any; evening?: any } } = {};
      
      allBookings.forEach(booking => {
        if (!bookingsByDate[booking.date]) {
          bookingsByDate[booking.date] = {};
        }
        
        if (booking.period === "morning" || booking.period === "both") {
          bookingsByDate[booking.date].morning = {
            id: booking.id,
            tenantName: booking.tenantName,
            phoneNumber: booking.phoneNumber,
            paid: booking.paid,
            remaining: booking.remaining,
            peopleCount: booking.peopleCount
          };
        }
        
        if (booking.period === "evening" || booking.period === "both") {
          bookingsByDate[booking.date].evening = {
            id: booking.id,
            tenantName: booking.tenantName,
            phoneNumber: booking.phoneNumber,
            paid: booking.paid,
            remaining: booking.remaining,
            peopleCount: booking.peopleCount
          };
        }
      });
      
      res.render('index', { bookings: JSON.stringify(bookingsByDate) });
    } catch (error) {
      console.error(error);
      res.status(500).send("حدث خطأ في استعراض الصفحة");
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
