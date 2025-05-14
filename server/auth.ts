import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { storage } from "./storage";
import { User as SelectUser, loginSchema } from "@shared/schema";

// Simple session-based authentication
export function setupAuth(app: Express) {
  // Set up session middleware
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "apartment-booking-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));

  // Middleware to make req.user available in templates
  app.use((req: any, res: Response, next: NextFunction) => {
    res.locals.user = req.session.user;
    next();
  });

  // Middleware to check if user is authenticated
  const isAuthenticated = (req: any, res: Response, next: NextFunction) => {
    if (req.session.user) {
      next();
    } else {
      res.status(401).json({ message: "غير مصرح" });
    }
  };

  // Register a new user
  app.post("/api/register", async (req, res, next) => {
    try {
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "بيانات غير صالحة", errors: validation.error.formErrors.fieldErrors });
      }

      const { username, password } = req.body;
      const name = req.body.name || username;
      const role = req.body.role || "user";

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "اسم المستخدم موجود بالفعل" });
      }

      // Create user with plain text password - real apps should hash the password
      const user = await storage.createUser({
        username,
        password,
        name,
        role
      });

      // Store user in session (except password)
      const { password: _, ...userWithoutPassword } = user;
      req.session.user = userWithoutPassword;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  // Login route
  app.post("/api/login", async (req, res, next) => {
    try {
      const { username, password } = req.body;
      
      // Simple authentication
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "اسم المستخدم أو كلمة المرور غير صحيحة" });
      }
      
      // Store user in session (except password)
      const { password: _, ...userWithoutPassword } = user;
      req.session.user = userWithoutPassword;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  // Logout route
  app.post("/api/logout", (req, res) => {
    req.session.destroy(err => {
      if (err) {
        return res.status(500).json({ message: "فشل في تسجيل الخروج" });
      }
      res.sendStatus(200);
    });
  });

  // Get current user
  app.get("/api/user", (req: any, res) => {
    if (!req.session.user) {
      return res.sendStatus(401);
    }
    res.json(req.session.user);
  });
  
  // Export isAuthenticated middleware
  return { isAuthenticated };
}
