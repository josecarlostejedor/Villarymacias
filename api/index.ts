import express from "express";
import { ROUTES } from "../src/types";

const app = express();
app.use(express.json());

// Health check / Verification endpoint
app.get("/api/ping", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    vercel: !!process.env.VERCEL,
    hasSheetsUrl: !!(process.env.GOOGLE_SHEETS_URL || process.env.VITE_GOOGLE_SHEETS_URL)
  });
});

// Main endpoint to save results
app.post("/api/results", async (req, res) => {
  const { name, surname, age, course, group, routeId, totalTime, responses, borgScale } = req.body;
  
  try {
    console.log(`[API] Processing results for ${name} ${surname}`);

    // 1. Calculate score
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

    // 2. Send to Google Sheets
    const googleSheetsUrl = (process.env.GOOGLE_SHEETS_URL || process.env.VITE_GOOGLE_SHEETS_URL || "").trim();
    
    if (googleSheetsUrl && googleSheetsUrl.startsWith("http")) {
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

      console.log("[SHEETS] Sending data to Google...");
      
      try {
        // We use a simple fetch. Node 18+ has it globally.
        await fetch(googleSheetsUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sheetData),
          redirect: 'follow'
        });
        console.log("[SHEETS] Success");
      } catch (sheetError: any) {
        console.error("[SHEETS] Error sending to Google:", sheetError.message);
      }
    } else {
      console.warn("[SHEETS] No valid URL found in environment variables");
    }

    // Always return success to the client to avoid blocking the UI
    res.json({ success: true });
  } catch (error) {
    console.error("[API] Fatal error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Return empty array for results to avoid crashes if the app tries to fetch them
app.get("/api/results", (req, res) => {
  res.json([]);
});

// Local development setup
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  const startDev = async () => {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      app.listen(3000, "0.0.0.0", () => {
        console.log("Dev server running on http://localhost:3000");
      });
    } catch (e) {
      console.error("Failed to start dev server:", e);
    }
  };
  startDev();
}

export default app;
