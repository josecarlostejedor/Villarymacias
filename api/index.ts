import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { ROUTES } from "../src/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use /tmp for SQLite on Vercel as the root is read-only
const dbPath = process.env.VERCEL ? path.join("/tmp", "orientation.db") : path.join(__dirname, "..", "orientation.db");
let db: any = null;

async function initDb() {
  if (process.env.VERCEL) {
    console.log("[DB] Running on Vercel, attempting to use /tmp/orientation.db");
  }
  try {
    const { default: Database } = await import("better-sqlite3");
    db = new Database(dbPath);
    
    db.exec(`
      CREATE TABLE IF NOT EXISTS results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        surname TEXT NOT NULL,
        age INTEGER,
        course TEXT NOT NULL,
        student_group TEXT NOT NULL,
        route_id INTEGER NOT NULL,
        total_time INTEGER NOT NULL,
        responses TEXT NOT NULL,
        borg_scale INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("[DB] Database initialized successfully");
  } catch (dbError) {
    console.error("[DB] Failed to initialize SQLite (Expected on some Vercel plans):", dbError);
    // db remains null, we will skip local saving but continue with the request
  }
}

const dbPromise = initDb();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check / Ping
  app.get("/api/ping", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV,
      hasSheetsUrl: !!(process.env.GOOGLE_SHEETS_URL || process.env.VITE_GOOGLE_SHEETS_URL)
    });
  });

  // API routes
  app.post("/api/results", async (req, res) => {
    await dbPromise; // Ensure we tried to init DB
    const { name, surname, age, course, group, routeId, totalTime, responses, borgScale } = req.body;
    
    console.log(`[API] Received result for: ${name} ${surname}`);

    try {
      let lastInsertRowid = null;
      
      // 1. Save to local DB if available
      if (db) {
        try {
          const stmt = db.prepare(`
            INSERT INTO results (name, surname, age, course, student_group, route_id, total_time, responses, borg_scale)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          const result = stmt.run(name, surname, age, course, group, routeId, totalTime, JSON.stringify(responses), borgScale);
          lastInsertRowid = result.lastInsertRowid;
          console.log("[DB] Result saved locally");
        } catch (dbSaveError) {
          console.error("[DB] Error saving locally:", dbSaveError);
        }
      }

      // 2. Prepare data for Google Sheets
      const route = ROUTES.find(r => Number(r.id) === Number(routeId));
      let correctBeacons = 0;
      if (route) {
        responses.forEach((resp: any) => {
          const baliza = route.balizas.find(b => Number(b.id) === Number(resp.balizaId));
          if (baliza && baliza.code.toLowerCase().trim() === resp.code.toLowerCase().trim()) {
            correctBeacons++;
          }
        });
      }

      const googleSheetsUrl = (process.env.GOOGLE_SHEETS_URL || process.env.VITE_GOOGLE_SHEETS_URL || "").trim();
      
      if (googleSheetsUrl) {
        const totalBalizas = route ? route.balizas.length : 0;
        const sheetData = {
          nombre: name || "Sin nombre",
          apellidos: surname || "Sin apellidos",
          edad: age || 0,
          curso: course || "N/A",
          grupo: group || "N/A",
          recorrido: route?.name || `Recorrido ${routeId}`,
          tiempo: totalTime || 0,
          puntuacion: correctBeacons || 0,
          borg: borgScale || 0,
          resultado: `${correctBeacons} aciertos, ${totalBalizas - correctBeacons} fallos`
        };

        console.log("[SHEETS] Sending to:", googleSheetsUrl.substring(0, 20) + "...");
        
        // Fire and forget or wait? We wait to ensure we can log the result
        try {
          const sheetResponse = await fetch(googleSheetsUrl, {
            method: 'POST',
            mode: 'no-cors', // Important for Google Apps Script
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sheetData),
            redirect: 'follow'
          });
          console.log("[SHEETS] Response status:", sheetResponse.status);
        } catch (sheetError: any) {
          console.error("[SHEETS] Fetch error:", sheetError.message);
        }
      } else {
        console.warn("[SHEETS] No URL configured in environment variables");
      }

      res.json({ success: true, id: lastInsertRowid });
    } catch (error) {
      console.error("[API] Fatal error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/results", (req, res) => {
    try {
      if (!db) {
        return res.json([]);
      }
      const results = db.prepare("SELECT * FROM results ORDER BY created_at DESC").all();
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch results" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  return app;
}

const appPromise = startServer();

export default async (req: any, res: any) => {
  const app = await appPromise;
  return app(req, res);
};
