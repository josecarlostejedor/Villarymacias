import express from "express";

// Self-contained ROUTES data to avoid cross-directory import issues in Vercel
const ROUTES = [
  {
    id: 1,
    name: "Recorrido 1",
    balizas: [
      { id: 1, code: "Pizarra Santibañez" },
      { id: 2, code: "1395-007" },
      { id: 3, code: "1395-043" },
      { id: 4, code: "1395-031" },
      { id: 5, code: "1395-022" },
      { id: 6, code: "1395-013" },
      { id: 7, code: "Jardín Geobotánico" },
      { id: 8, code: "Haya" },
    ]
  },
  {
    id: 2,
    name: "Recorrido 2",
    balizas: [
      { id: 1, code: "Pizarra Santibañez" },
      { id: 2, code: "1395-031" },
      { id: 3, code: "1395-026" },
      { id: 4, code: "1395-001" },
      { id: 5, code: "1395-021" },
      { id: 6, code: "Magnolio" },
      { id: 7, code: "1395-055" },
      { id: 8, code: "Alba & Andrea" },
    ]
  },
  {
    id: 3,
    name: "Recorrido 3",
    balizas: [
      { id: 1, code: "1395-067" },
      { id: 2, code: "Haya" },
      { id: 3, code: "1395-041" },
      { id: 4, code: "1395-018" },
      { id: 5, code: "1395-013" },
      { id: 6, code: "1395-022" },
      { id: 7, code: "1395-044" },
      { id: 8, code: "Paseo del Brezo" },
    ]
  },
  {
    id: 4,
    name: "Recorrido 4",
    balizas: [
      { id: 1, code: "1395-054" },
      { id: 2, code: "1395-041" },
      { id: 3, code: "1395-022" },
      { id: 4, code: "Jardín Geobotánico" },
      { id: 5, code: "1395-021" },
      { id: 6, code: "1395-044" },
      { id: 7, code: "Ligustrum Variegata" },
      { id: 8, code: "Paseo del Brezo" },
    ]
  },
  {
    id: 5,
    name: "Recorrido 5",
    balizas: [
      { id: 1, code: "Pizarra Santibañez" },
      { id: 2, code: "1395-067" },
      { id: 3, code: "Haya" },
      { id: 4, code: "1395-041" },
      { id: 5, code: "1395-031" },
      { id: 6, code: "1395-083" },
      { id: 7, code: "1395-021" },
      { id: 8, code: "1395-044" },
      { id: 9, code: "Alba & Andrea" },
    ]
  },
  {
    id: 6,
    name: "Recorrido 6",
    balizas: [
      { id: 1, code: "Pizarra Santibañez" },
      { id: 2, code: "1395-041" },
      { id: 3, code: "Haya" },
      { id: 4, code: "1395-031" },
      { id: 5, code: "1395-022" },
      { id: 6, code: "1395-083" },
      { id: 7, code: "1395-013" },
      { id: 8, code: "1395-001" },
      { id: 9, code: "1395-021" },
      { id: 10, code: "1395-044" },
      { id: 11, code: "Paseo del Brezo" },
    ]
  }
];

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
        const sheetResponse = await fetch(googleSheetsUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sheetData),
          redirect: 'follow'
        });
        
        const resultText = await sheetResponse.text();
        console.log("[SHEETS] Success:", resultText);
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
