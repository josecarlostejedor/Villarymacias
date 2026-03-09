import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { ROUTES } from "./src/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use /tmp for SQLite on Vercel as the root is read-only
const dbPath = process.env.VERCEL ? path.join("/tmp", "orientation.db") : "orientation.db";
let db: any;

async function initDb() {
  try {
    const { default: Database } = await import("better-sqlite3");
    db = new Database(dbPath);
    
    // Initialize database
    try {
      // Check if responses column exists to handle schema migration
      db.prepare("SELECT responses FROM results LIMIT 1").get();
    } catch (e) {
      // If it fails, the table might be old or not exist. 
      // Drop it to ensure we have the correct schema for this dev phase.
      db.exec("DROP TABLE IF EXISTS results");
    }

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
  } catch (dbError) {
    console.error("Failed to initialize SQLite database:", dbError);
    // We'll continue without local DB, relying on Google Sheets if configured
  }
}

const dbPromise = initDb();

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3000", 10);

  await dbPromise;

  app.use(express.json());

  // API routes
  app.post("/api/results", async (req, res) => {
    const { name, surname, age, course, group, routeId, totalTime, responses, borgScale } = req.body;
    
    try {
      let lastInsertRowid = null;
      
      // Save to local DB if available
      if (db) {
        try {
          const stmt = db.prepare(`
            INSERT INTO results (name, surname, age, course, student_group, route_id, total_time, responses, borg_scale)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          
          const result = stmt.run(name, surname, age, course, group, routeId, totalTime, JSON.stringify(responses), borgScale);
          lastInsertRowid = result.lastInsertRowid;
        } catch (dbSaveError) {
          console.error("Error saving to local DB:", dbSaveError);
        }
      }
      // Calculate score for Google Sheets
      const route = ROUTES.find(r => r.id === routeId);
      let correctBeacons = 0;
      if (route) {
        responses.forEach((resp: { balizaId: number; code: string }) => {
          const baliza = route.balizas.find(b => b.id === resp.balizaId);
          if (baliza && baliza.code.toLowerCase().trim() === resp.code.toLowerCase().trim()) {
            correctBeacons++;
          }
        });
      }

      // Send to Google Sheets if URL is configured
      const googleSheetsUrl = process.env.GOOGLE_SHEETS_URL;
      if (googleSheetsUrl) {
        try {
          const totalBalizas = route ? route.balizas.length : 0;
          const fallos = totalBalizas - correctBeacons;

          const sheetData = {
            nombre: name,
            apellidos: surname,
            edad: age,
            curso: course,
            grupo: group,
            recorrido: route?.name || `Recorrido ${routeId}`,
            tiempo: totalTime,
            puntuacion: correctBeacons,
            borg: borgScale,
            resultado: `${correctBeacons} aciertos, ${fallos} fallos`
          };

          // LOG for debugging in Vercel
          console.log("Protocolo Vercel-Sheets: Iniciando envío...", { 
            url: googleSheetsUrl.substring(0, 30) + "...",
            estudiante: `${name} ${surname}` 
          });

          // CRITICAL: We use text/plain to avoid CORS preflight issues with Google Apps Script
          // while still sending a valid JSON string that JSON.parse() can read.
          const sheetResponse = await fetch(googleSheetsUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(sheetData)
          });
          
          const responseText = await sheetResponse.text();
          console.log("Protocolo Vercel-Sheets: Respuesta de Google:", responseText);
          
          if (!sheetResponse.ok) {
            console.error(`Error en el puente: ${sheetResponse.status} ${sheetResponse.statusText}`);
          }
        } catch (sheetError) {
          console.error("Error sending to Google Sheets:", sheetError);
        }
      }

      res.json({ success: true, id: lastInsertRowid });
    } catch (error) {
      console.error("Error saving result:", error);
      res.status(500).json({ error: "Failed to save result" });
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
