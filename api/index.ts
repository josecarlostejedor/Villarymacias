import express from "express";

// Self-contained ROUTES data to avoid cross-directory import issues in Vercel
const ROUTES = [
  {
    id: 1,
    name: "Recorrido 1",
    balizas: [
      { id: 1, correctCode: "Pizarra Santibañez" },
      { id: 2, correctCode: "1395-007" },
      { id: 3, correctCode: "1395-043" },
      { id: 4, correctCode: "1395-031" },
      { id: 5, correctCode: "1395-022" },
      { id: 6, correctCode: "1395-013" },
      { id: 7, correctCode: "Jardín Geobotánico" },
      { id: 8, correctCode: "Haya" },
    ]
  },
  {
    id: 2,
    name: "Recorrido 2",
    balizas: [
      { id: 1, correctCode: "Pizarra Santibañez" },
      { id: 2, correctCode: "1395-031" },
      { id: 3, correctCode: "1395-026" },
      { id: 4, correctCode: "1395-001" },
      { id: 5, correctCode: "1395-021" },
      { id: 6, correctCode: "Magnolio" },
      { id: 7, correctCode: "1395-055" },
      { id: 8, correctCode: "Alba & Andrea" },
    ]
  },
  {
    id: 3,
    name: "Recorrido 3",
    balizas: [
      { id: 1, correctCode: "1395-067" },
      { id: 2, correctCode: "Haya" },
      { id: 3, correctCode: "1395-041" },
      { id: 4, correctCode: "1395-018" },
      { id: 5, correctCode: "1395-013" },
      { id: 6, correctCode: "1395-022" },
      { id: 7, correctCode: "1395-044" },
      { id: 8, correctCode: "Paseo del Brezo" },
    ]
  },
  {
    id: 4,
    name: "Recorrido 4",
    balizas: [
      { id: 1, correctCode: "1395-054" },
      { id: 2, correctCode: "1395-041" },
      { id: 3, correctCode: "1395-022" },
      { id: 4, correctCode: "Jardín Geobotánico" },
      { id: 5, correctCode: "1395-021" },
      { id: 6, correctCode: "1395-044" },
      { id: 7, correctCode: "Ligustrum Variegata" },
      { id: 8, correctCode: "Paseo del Brezo" },
    ]
  },
  {
    id: 5,
    name: "Recorrido 5",
    balizas: [
      { id: 1, correctCode: "Pizarra Santibañez" },
      { id: 2, correctCode: "1395-067" },
      { id: 3, correctCode: "Haya" },
      { id: 4, correctCode: "1395-041" },
      { id: 5, correctCode: "1395-031" },
      { id: 6, correctCode: "1395-083" },
      { id: 7, correctCode: "1395-021" },
      { id: 8, correctCode: "1395-044" },
      { id: 9, correctCode: "Alba & Andrea" },
    ]
  },
  {
    id: 6,
    name: "Recorrido 6",
    balizas: [
      { id: 1, correctCode: "Pizarra Santibañez" },
      { id: 2, correctCode: "1395-041" },
      { id: 3, correctCode: "Haya" },
      { id: 4, correctCode: "1395-031" },
      { id: 5, correctCode: "1395-022" },
      { id: 6, correctCode: "1395-083" },
      { id: 7, correctCode: "1395-013" },
      { id: 8, correctCode: "1395-001" },
      { id: 9, correctCode: "1395-021" },
      { id: 10, correctCode: "1395-044" },
      { id: 11, correctCode: "Paseo del Brezo" },
    ]
  }
];

const app = express();
app.use(express.json());

// Helper to normalize strings (consistent with client-side utils_data.ts)
const normalizeString = (str: string) => {
  if (!str) return '';
  const stopWords = ['para', 'de', 'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'y', 'o', 'en', 'con'];
  let normalized = str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove accents
    
  const words = normalized.split(/\s+/);
  const filteredWords = words.filter(word => !stopWords.includes(word));
  return filteredWords.join('').replace(/[^a-z0-9]/g, '');
};

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
        if (baliza && normalizeString(baliza.correctCode) === normalizeString(resp.code)) {
          correctBeacons++;
        }
      });
    }

    // 2. Send to Google Sheets
    const googleSheetsUrl = (
      process.env.GOOGLE_SHEETS_URL || 
      process.env.VITE_GOOGLE_SHEETS_URL || 
      process.env.VITE_SHEETS_URL || 
      process.env.SHEETS_URL || 
      ""
    ).trim();
    
    console.log(`[API] Google Sheets URL is ${googleSheetsUrl ? "configured" : "MISSING"}`);
    
    if (googleSheetsUrl && googleSheetsUrl.startsWith("http")) {
      const totalBalizas = route ? route.balizas.length : 0;
      const score10 = totalBalizas > 0 ? (correctBeacons / totalBalizas) * 10 : 0;
      
      const formatTimeHMS = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      };

      const sheetData: any = {
        nombre: name || "Sin nombre",
        apellidos: surname || "Sin apellidos",
        edad: age || 0,
        curso: course || "N/A",
        grupo: group || "N/A",
        recorrido: route?.name || `Recorrido ${routeId}`,
        tiempo: formatTimeHMS(totalTime),
        puntuacion: correctBeacons || 0,
        puntuacion_final: score10.toFixed(1),
        borg: borgScale || 0,
        resultado: `${correctBeacons} aciertos, ${totalBalizas - correctBeacons} fallos`,
        aciertos_detalle: `${correctBeacons} aciertos, ${totalBalizas - correctBeacons} fallos`,
        aciertos_texto: `${correctBeacons} aciertos, ${totalBalizas - correctBeacons} fallos`,
        resumen: `${correctBeacons} aciertos, ${totalBalizas - correctBeacons} fallos`,
        aciertos: correctBeacons || 0,
        hits_misses: `${correctBeacons} aciertos, ${totalBalizas - correctBeacons} fallos`,
        aciertos_num: correctBeacons || 0,
        timestamp: new Date().toISOString(),
        // English keys for consistency with client-side
        firstName: name || "Sin nombre",
        lastName: surname || "Sin apellidos",
        age: age || 0,
        course: course || "N/A",
        groupName: group || "N/A",
        routeName: route?.name || `Recorrido ${routeId}`,
        totalTime: formatTimeHMS(totalTime),
        score: correctBeacons || 0,
        correctCount: correctBeacons || 0,
        borgScale: borgScale || 0
      };

      // Add partials and codes
      for (let i = 0; i < 11; i++) {
        sheetData[`p${i + 1}`] = responses[i] ? formatTimeHMS(responses[i].partialTime) : "";
        sheetData[`c${i + 1}`] = responses[i] ? responses[i].code : "";
      }

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
