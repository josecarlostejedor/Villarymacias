/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Vercel Deployment Fix: Forcing rewrite of App.tsx to resolve syntax error
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Timer, 
  Map as MapIcon, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Play, 
  FileText, 
  User,
  Activity
} from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { jsPDF } from 'jspdf';

import { ROUTES, COURSES, GROUPS, Route } from './constants_data';
import { UserData, RaceResult, BalizaResult } from './types_data';
import { cn, normalizeString } from './lib/utils_data';

type AppStep = 'FORM' | 'ROUTE_SELECT' | 'RACE' | 'BORG' | 'RESULTS';

export default function App() {
  const [step, setStep] = useState<AppStep>('FORM');
  const [userData, setUserData] = useState<UserData>({
    firstName: '',
    lastName: '',
    age: '',
    course: COURSES[0],
    group: GROUPS[0],
  });
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [currentBalizaIndex, setCurrentBalizaIndex] = useState(0);
  const [enteredCodes, setEnteredCodes] = useState<string[]>([]);
  const [balizaTimestamps, setBalizaTimestamps] = useState<number[]>([]);
  const [borgScale, setBorgScale] = useState<number>(5);
  const [raceResult, setRaceResult] = useState<RaceResult | null>(null);
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [accessCodeError, setAccessCodeError] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const googleSheetsUrl = import.meta.env.VITE_GOOGLE_SHEETS_URL || import.meta.env.VITE_SHEETS_URL;

  // Timer logic
  useEffect(() => {
    if (startTime && step === 'RACE') {
      timerRef.current = setInterval(() => {
        setCurrentTime(Date.now() - startTime);
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTime, step]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const tenths = Math.floor((ms % 1000) / 100);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${tenths}`;
  };

  const formatTimeHMS = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleStartRace = () => {
    if (selectedRoute?.accessCode) {
      if (normalizeString(accessCodeInput) !== normalizeString(selectedRoute.accessCode)) {
        setAccessCodeError(true);
        return;
      }
    }
    const now = Date.now();
    setStartTime(now);
    setBalizaTimestamps([now]);
    setCurrentBalizaIndex(0);
    setEnteredCodes(Array(selectedRoute.balizas.length).fill(''));
    setStep('RACE');
  };

  const handleBalizaSubmit = (code: string) => {
    const now = Date.now();
    const newCodes = [...enteredCodes];
    newCodes[currentBalizaIndex] = code;
    setEnteredCodes(newCodes);
    
    // Guardamos el timestamp específico para esta baliza (index + 1 porque el 0 es el inicio)
    setBalizaTimestamps(prev => {
      const next = [...prev];
      next[currentBalizaIndex + 1] = now;
      return next;
    });

    if (currentBalizaIndex < selectedRoute.balizas.length - 1) {
      setCurrentBalizaIndex(currentBalizaIndex + 1);
    }
  };

  const handleFinishRace = () => {
    const now = Date.now();
    setBalizaTimestamps(prev => {
      const next = [...prev];
      // El timestamp final va después de todas las balizas posibles
      if (selectedRoute) {
        next[selectedRoute.balizas.length + 1] = now;
      }
      return next;
    });
    setStep('BORG');
  };

  const calculateResults = () => {
    try {
      if (!selectedRoute) return;

      // Filtramos timestamps válidos para encontrar el final real
      const validTimestamps = balizaTimestamps.filter(t => t !== undefined && t !== null);
      const endTime = validTimestamps.length > 0 ? validTimestamps[validTimestamps.length - 1] : Date.now();
      const totalTime = endTime - (startTime || 0);
      
      const results: BalizaResult[] = selectedRoute.balizas.map((b, idx) => {
        // El tiempo de la baliza actual está en idx + 1
        const currentTime = balizaTimestamps[idx + 1];
        // El tiempo previo es el anterior disponible (o el inicio si es la primera)
        let previousTime = startTime || 0;
        for (let i = idx; i >= 0; i--) {
          if (balizaTimestamps[i] !== undefined) {
            previousTime = balizaTimestamps[i];
            break;
          }
        }
        
        const pTime = (currentTime !== undefined) ? currentTime - previousTime : 0;
          
        return {
          balizaId: b.id,
          enteredCode: enteredCodes[idx] || '',
          isCorrect: normalizeString(enteredCodes[idx] || '') === normalizeString(b.correctCode),
          correctCode: b.correctCode,
          description: b.description,
          partialTime: pTime,
        };
      });

      const correctCount = results.filter(r => r.isCorrect).length;
      const score = (correctCount / selectedRoute.balizas.length) * 10;

      const finalResult: RaceResult = {
        userData,
        routeId: selectedRoute.id,
        routeName: selectedRoute.name,
        startTime: startTime || 0,
        endTime,
        totalTime,
        results,
        score,
        borgScale,
        date: new Date().toLocaleString(),
      };

      // Establecemos el resultado ANTES de intentar el envío a Sheets
      // para asegurar que el usuario vea sus resultados pase lo que pase.
      setRaceResult(finalResult);
      setStep('RESULTS');

      // 1. INTENTO DE ENVÍO VÍA BACKEND (Más fiable, evita CORS)
      const backendPayload = {
        name: userData.firstName,
        surname: userData.lastName,
        age: userData.age,
        course: userData.course,
        group: userData.group,
        routeId: selectedRoute.id,
        totalTime: totalTime,
        responses: results.map(r => ({
          balizaId: r.balizaId,
          code: r.enteredCode,
          partialTime: r.partialTime
        })),
        borgScale: borgScale
      };

      console.log("Enviando a API interna...");
      fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendPayload)
      })
      .then(r => r.ok ? r.json() : Promise.reject('Error en API'))
      .then(data => console.log("Registro en API exitoso:", data))
      .catch(err => {
        console.warn("Fallo registro en API, intentando envío directo...", err);
        
        // 2. FALLBACK: ENVÍO DIRECTO (Si el backend falla o no está disponible)
        if (googleSheetsUrl) {
          const timeTotalStr = formatTimeHMS(totalTime);
          const payload = {
            timestamp: new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' }),
            nombre: userData.firstName,
            apellidos: userData.lastName,
            curso: userData.course,
            grupo: userData.group,
            edad: userData.age,
            recorrido: selectedRoute.name,
            puntuacion: score.toFixed(1),
            puntuacion_final: score.toFixed(1),
            tiempo_total: timeTotalStr,
            escala_borg: borgScale,
            aciertos: correctCount,
            resultado: `${correctCount} aciertos, ${selectedRoute.balizas.length - correctCount} fallos`,
            // Extra keys for compatibility
            tiempo: timeTotalStr,
            borg: borgScale,
            aciertos_detalle: `${correctCount} aciertos, ${selectedRoute.balizas.length - correctCount} fallos`,
            aciertos_texto: `${correctCount} aciertos, ${selectedRoute.balizas.length - correctCount} fallos`,
            resumen: `${correctCount} aciertos, ${selectedRoute.balizas.length - correctCount} fallos`,
            hits_misses: `${correctCount} aciertos, ${selectedRoute.balizas.length - correctCount} fallos`,
            aciertos_num: correctCount,
            // Claves en Inglés
            firstName: userData.firstName,
            lastName: userData.lastName,
            course: userData.course,
            groupName: userData.group,
            age: userData.age,
            routeName: selectedRoute.name,
            score: score.toFixed(1),
            totalTime: timeTotalStr,
            borgScale: borgScale,
            correctCount: correctCount,
            // Parciales y códigos
            ...Object.fromEntries(results.slice(0, 11).map((r, i) => [`p${i+1}`, formatTimeHMS(r.partialTime || 0)])),
            ...Object.fromEntries(results.slice(0, 11).map((r, i) => [`c${i+1}`, r.enteredCode || ""]))
          };

          fetch(googleSheetsUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(payload)
          })
          .then(() => console.log("Envío directo completado"))
          .catch(e => console.error("Error envío directo:", e));
        }
      });
    } catch (error) {
      console.error("Error en calculateResults:", error);
      // Intentamos forzar el paso a resultados aunque haya fallado algo secundario
      setStep('RESULTS');
    }
  };

  const generatePDF = async () => {
    if (!selectedRoute || !raceResult || isGeneratingPDF) return;
    
    setIsGeneratingPDF(true);
    console.log("Iniciando generación de PDF...");
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let y = margin;

      // --- PÁGINA 1: DATOS Y RESULTADOS ---
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(22);
      pdf.setTextColor(30, 30, 30);
      pdf.text("Recorridos de Orientación. Parque Villar y Macias.", margin, y);
      y += 8;

      pdf.setFontSize(12);
      pdf.setTextColor(5, 150, 105);
      pdf.text("IES LUCÍA DE MEDRANO", margin, y);
      y += 5;
      
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text("(App creada por J.C. Tejedor)", margin, y);
      
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Fecha: ${raceResult.date}`, pageWidth - margin, y - 5, { align: 'right' });
      y += 10;

      pdf.setDrawColor(230, 230, 230);
      pdf.setLineWidth(0.5);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 15;

      const colWidth = (pageWidth - (margin * 2) - 10) / 2;
      
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.setTextColor(30, 30, 30);
      pdf.text("Datos del Corredor", margin, y);
      pdf.line(margin, y + 2, margin + colWidth, y + 2);
      
      let dataY = y + 10;
      const drawDataField = (label: string, value: string, x: number, currentY: number) => {
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(label.toUpperCase(), x, currentY);
        pdf.setFontSize(11);
        pdf.setTextColor(50, 50, 50);
        pdf.text(value, x, currentY + 5);
        return currentY + 15;
      };

      dataY = drawDataField("Nombre Completo", `${raceResult.userData.firstName} ${raceResult.userData.lastName}`, margin, dataY);
      dataY = drawDataField("Edad", `${raceResult.userData.age} años`, margin, dataY);
      dataY = drawDataField("Curso", raceResult.userData.course, margin, dataY);
      dataY = drawDataField("Grupo", raceResult.userData.group, margin, dataY);

      const col2X = margin + colWidth + 10;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.setTextColor(30, 30, 30);
      pdf.text("Resumen de Carrera", col2X, y);
      pdf.line(col2X, y + 2, col2X + colWidth, y + 2);
      
      let summaryY = y + 10;
      summaryY = drawDataField("Recorrido", raceResult.routeName, col2X, summaryY);
      summaryY = drawDataField("Tiempo Total", formatTimeHMS(raceResult.totalTime), col2X, summaryY);
      
      const correctCount = raceResult.results.filter(r => r.isCorrect).length;
      const totalCount = raceResult.results.length;
      summaryY = drawDataField("Resultado", `${correctCount} aciertos, ${totalCount - correctCount} fallos`, col2X, summaryY);

      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text("PUNTUACIÓN", col2X, summaryY);
      pdf.setFontSize(20);
      pdf.setTextColor(5, 150, 105);
      pdf.text(`${raceResult.score.toFixed(1)} / 10`, col2X, summaryY + 8);
      summaryY += 18;
      
      summaryY = drawDataField("Escala de Borg", `${raceResult.borgScale} / 10`, col2X, summaryY);

      y = Math.max(dataY, summaryY) + 10;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.setTextColor(30, 30, 30);
      pdf.text("Desglose de Balizas", margin, y);
      pdf.line(margin, y + 2, pageWidth - margin, y + 2);
      y += 10;

      // Cabecera de la tabla
      pdf.setFillColor(245, 245, 245);
      pdf.rect(margin, y, pageWidth - (margin * 2), 8, 'F');
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text("#", margin + 5, y + 5.5);
      pdf.text("DESCRIPCIÓN", margin + 15, y + 5.5);
      pdf.text("CÓDIGO", margin + 90, y + 5.5);
      pdf.text("T. PARCIAL", margin + 125, y + 5.5);
      pdf.text("RESULTADO", margin + 160, y + 5.5);
      y += 8;

      raceResult.results.forEach((res, idx) => {
        // Control de salto de página si la tabla es muy larga (Recorrido 6)
        if (y > 270) {
          pdf.addPage();
          y = margin;
          // Re-dibujar cabecera en nueva página
          pdf.setFillColor(245, 245, 245);
          pdf.rect(margin, y, pageWidth - (margin * 2), 8, 'F');
          pdf.setFontSize(9);
          pdf.setTextColor(100, 100, 100);
          pdf.text("#", margin + 5, y + 5.5);
          pdf.text("DESCRIPCIÓN", margin + 15, y + 5.5);
          pdf.text("CÓDIGO", margin + 90, y + 5.5);
          pdf.text("T. PARCIAL", margin + 125, y + 5.5);
          pdf.text("RESULTADO", margin + 160, y + 5.5);
          y += 8;
        }

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.setTextColor(80, 80, 80);
        
        if (idx % 2 === 1) {
          pdf.setFillColor(252, 252, 252);
          pdf.rect(margin, y, pageWidth - (margin * 2), 10, 'F');
        }
        
        pdf.text((idx + 1).toString(), margin + 5, y + 6.5);
        pdf.text(res.description, margin + 15, y + 6.5);
        pdf.text(res.enteredCode || "-", margin + 90, y + 6.5);
        
        // Mostramos el tiempo parcial formateado
        const timeStr = formatTimeHMS(res.partialTime || 0);
        pdf.text(timeStr, margin + 125, y + 6.5);
        
        if (res.isCorrect) {
          pdf.setTextColor(5, 150, 105);
          pdf.text("Correcto", margin + 160, y + 6.5);
        } else {
          pdf.setTextColor(220, 38, 38);
          pdf.text("Fallido", margin + 160, y + 6.5);
        }
        
        pdf.setDrawColor(240, 240, 240);
        pdf.line(margin, y + 10, pageWidth - margin, y + 10);
        y += 10;
      });

      // --- PÁGINA 2: MAPA ---
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos de timeout para el mapa
        
        const response = await fetch(selectedRoute.mapUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const blob = await response.blob();
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            const timer = setTimeout(() => reject(new Error("Timeout reading blob")), 3000);
            reader.onloadend = () => {
              clearTimeout(timer);
              resolve(reader.result as string);
            };
            reader.onerror = () => {
              clearTimeout(timer);
              reject(reader.error);
            };
            reader.readAsDataURL(blob);
          });

          pdf.addPage();
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(14);
          pdf.setTextColor(30, 30, 30);
          pdf.text("Mapa del Recorrido", margin, margin);
          pdf.line(margin, margin + 2, pageWidth - margin, margin + 2);

          const imgProps = pdf.getImageProperties(base64);
          console.log("Propiedades de imagen cargadas:", imgProps.fileType);
          
          const supportedTypes = ['JPEG', 'JPG', 'PNG', 'WEBP'];
          if (!supportedTypes.includes(imgProps.fileType.toUpperCase())) {
            throw new Error(`Unsupported image type: ${imgProps.fileType}`);
          }
          
          const availableW = pageWidth - (margin * 2);
          const availableH = pageHeight - (margin * 3);
          
          let finalW = availableW;
          let finalH = (imgProps.height * finalW) / imgProps.width;
          
          if (finalH > availableH) {
            finalH = availableH;
            finalW = (imgProps.width * finalH) / imgProps.height;
          }
          
          const xPos = (pageWidth - finalW) / 2;
          const yPos = margin + 10;
          
          pdf.addImage(base64, imgProps.fileType, xPos, yPos, finalW, finalH, undefined, 'FAST');
          console.log("Mapa añadido al PDF");
        } else {
          console.warn("No se pudo cargar el mapa:", response.status);
        }
      } catch (e) {
        console.error("Error al cargar mapa para PDF:", e);
      }

      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text("IES LUCÍA DE MEDRANO - Departamento de E.F.", pageWidth / 2, pageHeight - 10, { align: 'center' });
        pdf.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
      }

      const sanitizedName = (userData.firstName || 'Carrera').replace(/[^a-z0-9]/gi, '_');
      const fileName = `Resultado_${sanitizedName}.pdf`;
      console.log("Guardando PDF:", fileName);
      pdf.save(fileName);

    } catch (error) {
      console.error("Error crítico al generar PDF:", error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-emerald-100">
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-200 sticky top-0 z-50 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 p-2 rounded-xl shadow-inner">
            <MapIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-black text-lg tracking-tight leading-none">Recorridos de Orientación. Parque Villar y Macias.</h1>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-tighter">IES LUCÍA DE MEDRANO</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {step === 'RACE' && (
            <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full font-mono text-sm font-bold text-emerald-700 border border-emerald-100 shadow-sm">
              <Timer className="w-4 h-4 animate-pulse" />
              {formatTime(currentTime)}
            </div>
          )}
          {(step === 'ROUTE_SELECT' || step === 'RACE' || step === 'RESULTS') && (
            <div className="hidden sm:flex items-center gap-2 bg-stone-100 px-3 py-1.5 rounded-full text-[10px] font-bold text-stone-500 border border-stone-200">
              <User className="w-3 h-3" />
              {userData.course} - {userData.group}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 pb-24">
        <AnimatePresence mode="wait">
          {step === 'FORM' && (
            <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <div className="space-y-4 text-center">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-stone-800 leading-tight tracking-tighter">Recorridos de Orientación. Parque Villar y Macias.</h2>
                  <div className="flex items-center justify-center gap-2">
                    <span className="h-px w-8 bg-emerald-200"></span>
                    <p className="text-sm font-bold text-emerald-700 uppercase tracking-wider">IES LUCÍA DE MEDRANO</p>
                    <span className="h-px w-8 bg-emerald-200"></span>
                  </div>
                  <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Departamento de Educación Física</p>
                </div>
                
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white aspect-[16/9]">
                    <img src="https://raw.githubusercontent.com/josecarlostejedor/orientacion-huerta-otea/main/recorridoorienta.jpg" alt="Orientación" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
                      <div className="text-left">
                        <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">Localización</p>
                        <p className="text-white text-sm font-bold">Parque Villar y Macias, Salamanca.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-left pt-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-emerald-600 rounded-full"></div>
                  <h3 className="text-lg font-black text-stone-800 tracking-tight">Datos del Corredor</h3>
                </div>
              </div>

              <div className="space-y-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                <input type="text" placeholder="Nombre" className="w-full px-4 py-3 rounded-xl border border-stone-200 outline-none" value={userData.firstName} onChange={(e) => setUserData({ ...userData, firstName: e.target.value })} />
                <input type="text" placeholder="Apellidos" className="w-full px-4 py-3 rounded-xl border border-stone-200 outline-none" value={userData.lastName} onChange={(e) => setUserData({ ...userData, lastName: e.target.value })} />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="Edad" className="w-full px-4 py-3 rounded-xl border border-stone-200 outline-none" value={userData.age} onChange={(e) => setUserData({ ...userData, age: e.target.value })} />
                  <select className="w-full px-4 py-3 rounded-xl border border-stone-200 outline-none bg-white" value={userData.group} onChange={(e) => setUserData({ ...userData, group: e.target.value })}>
                    {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <select className="w-full px-4 py-3 rounded-xl border border-stone-200 outline-none bg-white" value={userData.course} onChange={(e) => setUserData({ ...userData, course: e.target.value })}>
                  {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <button disabled={!userData.firstName || !userData.lastName} onClick={() => setStep('ROUTE_SELECT')} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors">
                Continuar <ChevronRight className="w-5 h-5" />
              </button>

              <footer className="pt-8 border-t border-stone-200 text-center space-y-3">
                <div className="flex justify-center gap-4 opacity-50">
                  <Activity className="w-4 h-4" />
                  <MapIcon className="w-4 h-4" />
                  <Timer className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-stone-400 uppercase tracking-tighter">Proyecto de Orientación Escolar</p>
                  <p className="text-[11px] font-black text-stone-500 uppercase">App creada por J.C. Tejedor</p>
                </div>
              </footer>
            </motion.div>
          )}

          {step === 'ROUTE_SELECT' && (
            <motion.div key="route-select" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="flex items-center gap-2">
                <button onClick={() => setStep('FORM')} className="p-2 hover:bg-stone-200 rounded-full transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                <h2 className="text-2xl font-bold text-stone-800">Selecciona Recorrido</h2>
              </div>

              <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-emerald-600 p-2 rounded-lg">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Corredor Registrado</p>
                    <p className="text-lg font-black text-stone-800 leading-none">{userData.firstName} {userData.lastName}</p>
                  </div>
                </div>
                <div className="flex gap-4 pt-3 border-t border-emerald-100/50">
                  <div>
                    <p className="text-[9px] font-bold text-stone-400 uppercase">Curso</p>
                    <p className="text-sm font-bold text-stone-600">{userData.course}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-stone-400 uppercase">Grupo</p>
                    <p className="text-sm font-bold text-stone-600">{userData.group}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-stone-400 uppercase">Edad</p>
                    <p className="text-sm font-bold text-stone-600">{userData.age} años</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                {ROUTES.map((route) => (
                  <button key={route.id} onClick={() => { setSelectedRoute(route); setAccessCodeInput(''); setAccessCodeError(false); }} className={cn("p-6 rounded-2xl border-2 text-left transition-all flex items-center justify-between", selectedRoute?.id === route.id ? "border-emerald-500 bg-emerald-50" : "border-stone-200 bg-white")}>
                    <div><h3 className="font-bold text-lg">{route.name}</h3><p className="text-stone-500 text-sm">{route.balizas.length} Balizas</p></div>
                    {selectedRoute?.id === route.id ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <ChevronRight className="w-6 h-6 text-stone-300" />}
                  </button>
                ))}
              </div>

              {selectedRoute?.accessCode && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">Este recorrido requiere código de acceso</p>
                  <input 
                    type="text" 
                    placeholder="Introduce el código de apertura" 
                    className={cn(
                      "w-full px-4 py-3 rounded-xl border outline-none transition-all",
                      accessCodeError ? "border-red-500 bg-red-50" : "border-stone-200 focus:border-emerald-500"
                    )}
                    value={accessCodeInput}
                    onChange={(e) => { setAccessCodeInput(e.target.value); setAccessCodeError(false); }}
                  />
                  {accessCodeError && <p className="text-[10px] text-red-500 font-bold ml-1 uppercase tracking-tighter">Código incorrecto. Inténtalo de nuevo.</p>}
                </div>
              )}

              {selectedRoute && <button onClick={handleStartRace} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2"><Play className="w-5 h-5 fill-current" /> Comenzar Carrera</button>}
            </motion.div>
          )}

          {step === 'RACE' && selectedRoute && (
            <motion.div key="race" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="bg-stone-200 rounded-2xl overflow-hidden border border-stone-300 h-[50vh] relative">
                <TransformWrapper initialScale={1} minScale={0.5} maxScale={4} centerOnInit={true}>
                  <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
                    <img src={selectedRoute.mapUrl} alt="Mapa" className="w-full h-full object-contain bg-white" referrerPolicy="no-referrer" crossOrigin="anonymous" />
                  </TransformComponent>
                </TransformWrapper>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                <div className="flex flex-col">
                  <span className="text-xs font-bold uppercase text-emerald-600">Baliza {currentBalizaIndex + 1} de {selectedRoute.balizas.length}</span>
                  <span className="text-[10px] font-bold text-[#800000] mt-0.5">(Título principal del cartel o código numero en formato 0000-000)</span>
                </div>
                <div className="flex gap-2">
                  <input type="text" autoFocus className="flex-1 px-4 py-4 rounded-xl border-2 border-stone-200 focus:border-emerald-500 outline-none text-2xl font-bold text-center" placeholder="---" value={enteredCodes[currentBalizaIndex]} onChange={(e) => { const newCodes = [...enteredCodes]; newCodes[currentBalizaIndex] = e.target.value; setEnteredCodes(newCodes); }} />
                  {currentBalizaIndex < selectedRoute.balizas.length - 1 ? (
                    <button onClick={() => handleBalizaSubmit(enteredCodes[currentBalizaIndex])} disabled={!enteredCodes[currentBalizaIndex]} className="bg-emerald-600 disabled:bg-stone-200 text-white px-6 rounded-xl font-bold">Sig.</button>
                  ) : (
                    <button onClick={handleFinishRace} disabled={!enteredCodes[currentBalizaIndex]} className="bg-red-600 disabled:bg-stone-200 text-white px-6 rounded-xl font-bold">Fin</button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {step === 'BORG' && (
            <motion.div key="borg" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8 py-4">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-stone-800">Escala de Borg</h2>
                <p className="text-stone-500">¿Nivel de fatiga percibida?</p>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-8">
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  step="1" 
                  className={cn(
                    "w-full h-3 bg-stone-100 rounded-lg appearance-none cursor-pointer transition-all",
                    borgScale <= 3 ? "accent-emerald-500" : borgScale <= 7 ? "accent-amber-500" : "accent-red-500"
                  )} 
                  value={borgScale} 
                  onChange={(e) => setBorgScale(parseInt(e.target.value))} 
                />
                <div className={cn(
                  "p-6 rounded-2xl text-center border-2 transition-all duration-300",
                  borgScale <= 3 ? "bg-emerald-50 border-emerald-200 text-emerald-700" : 
                  borgScale <= 7 ? "bg-amber-50 border-amber-200 text-amber-700" : 
                  "bg-red-50 border-red-200 text-red-700"
                )}>
                  <span className="block text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Esfuerzo Percibido</span>
                  <span className="text-4xl font-black">{borgScale}</span>
                  <p className="text-xs font-bold mt-2">
                    {borgScale <= 3 ? 'Muy Suave / Suave' : borgScale <= 7 ? 'Moderado / Duro' : 'Muy Duro / Máximo'}
                  </p>
                </div>
              </div>
              <button onClick={calculateResults} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-transform">Ver Resultados</button>
            </motion.div>
          )}

          {step === 'RESULTS' && raceResult && (
            <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm text-center space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
                <h2 className="text-stone-500 font-bold uppercase text-xs tracking-widest">Puntuación Final</h2>
                <div className="text-7xl font-black text-emerald-600 tracking-tighter drop-shadow-sm">
                  {raceResult.score.toFixed(1)}
                  <span className="text-2xl text-stone-300 font-light ml-1">/10</span>
                </div>

                <div className="flex justify-center gap-8 pt-6 border-t border-stone-100">
                  <div className="text-center">
                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-tighter">Tiempo</p>
                    <p className="font-bold text-stone-700">{formatTime(raceResult.totalTime)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-tighter">Aciertos</p>
                    <p className="font-bold text-stone-700">{raceResult.results.filter(r => r.isCorrect).length}/{selectedRoute.balizas.length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-tighter">Grupo</p>
                    <p className="font-bold text-stone-700">{raceResult.userData.course} {raceResult.userData.group}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={generatePDF} 
                  disabled={isGeneratingPDF}
                  className={cn(
                    "flex-1 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95",
                    isGeneratingPDF ? "bg-stone-400 cursor-not-allowed" : "bg-stone-900 hover:bg-black"
                  )}
                >
                  {isGeneratingPDF ? (
                    <>Generando...</>
                  ) : (
                    <>
                      <FileText className="w-5 h-5" /> Descargar PDF
                    </>
                  )}
                </button>
                <button onClick={() => window.location.reload()} className="bg-stone-100 text-stone-600 font-bold px-6 rounded-2xl hover:bg-stone-200 transition-colors">
                  Reiniciar
                </button>
              </div>

              <footer className="pt-8 text-center space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">IES LUCÍA DE MEDRANO</p>
                  <p className="text-[11px] font-black text-stone-500 uppercase">App creada por J.C. Tejedor</p>
                </div>
                
                {import.meta.env.VITE_GOOGLE_SHEETS_VIEW_URL && (
                  <div className="flex justify-center">
                    <a href={import.meta.env.VITE_GOOGLE_SHEETS_VIEW_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-tighter hover:bg-emerald-100 transition-colors border border-emerald-100">
                      <FileText className="w-3 h-3" /> Ver Registro en Google Sheets
                    </a>
                  </div>
                )}
              </footer>

            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Hidden PDF content for generation */}
      {raceResult && selectedRoute && (
        <div style={{ position: 'fixed', left: '-9999px', top: '0', width: '800px', background: 'white', visibility: 'visible', pointerEvents: 'none', zIndex: -1000 }}>
          <div ref={reportRef} className="w-[800px] bg-white text-stone-900 p-12">
            <div className="space-y-10">
              <div className="flex justify-between items-start border-b-2 border-stone-100 pb-8">
                <div>
                  <h1 className="text-3xl font-black text-stone-800 tracking-tight">Recorridos de Orientación. Parque Villar y Macias.</h1>
                  <p className="text-emerald-600 font-bold text-sm uppercase tracking-wider mt-1">IES LUCÍA DE MEDRANO</p>
                  <p className="text-stone-400 text-[10px] italic mt-2">(App creada por J.C. Tejedor)</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Fecha de Emisión</p>
                  <p className="text-sm font-bold text-stone-700">{raceResult.date}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
                    <User className="w-5 h-5 text-emerald-600" />
                    <h2 className="text-xl font-black text-stone-800">Datos del Corredor</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                    <div>
                      <p className="text-[9px] font-black text-stone-400 uppercase tracking-tighter">Nombre Completo</p>
                      <p className="text-lg font-bold text-stone-800 leading-tight">{raceResult.userData.firstName} {raceResult.userData.lastName}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-stone-400 uppercase tracking-tighter">Edad</p>
                      <p className="text-lg font-bold text-stone-800 leading-tight">{raceResult.userData.age} años</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-stone-400 uppercase tracking-tighter">Curso</p>
                      <p className="text-lg font-bold text-stone-800 leading-tight">{raceResult.userData.course}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-stone-400 uppercase tracking-tighter">Grupo</p>
                      <p className="text-lg font-bold text-stone-800 leading-tight">{raceResult.userData.group}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
                    <Activity className="w-5 h-5 text-emerald-600" />
                    <h2 className="text-xl font-black text-stone-800">Resumen de Carrera</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                    <div>
                      <p className="text-[9px] font-black text-stone-400 uppercase tracking-tighter">Recorrido</p>
                      <p className="text-lg font-bold text-stone-800 leading-tight">{raceResult.routeName}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-stone-400 uppercase tracking-tighter">Tiempo Total</p>
                      <p className="text-lg font-bold text-emerald-600 leading-tight">{formatTimeHMS(raceResult.totalTime)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-stone-400 uppercase tracking-tighter">Puntuación</p>
                      <p className="text-2xl font-black text-emerald-600 leading-tight">{raceResult.score.toFixed(1)} / 10</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-stone-400 uppercase tracking-tighter">Escala de Borg</p>
                      <p className="text-lg font-bold text-stone-800 leading-tight">{raceResult.borgScale} / 10</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <h2 className="text-xl font-black text-stone-800 border-b border-stone-100 pb-2">Desglose de Balizas</h2>
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-stone-50 text-[10px] font-black text-stone-400 uppercase tracking-widest">
                      <th className="p-4">#</th>
                      <th className="p-4">Descripción</th>
                      <th className="p-4">Código Ingresado</th>
                      <th className="p-4">Tiempo Parcial</th>
                      <th className="p-4">Resultado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {raceResult.results.map((res, idx) => (
                      <tr key={idx} className="text-sm">
                        <td className="p-4 font-bold text-stone-400">{idx + 1}</td>
                        <td className="p-4 font-medium text-stone-600">{res.description}</td>
                        <td className="p-4 font-mono text-stone-500">{res.enteredCode || '-'}</td>
                        <td className="p-4 font-mono text-stone-500">{formatTimeHMS(res.partialTime || 0)}</td>
                        <td className="p-4">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter",
                            res.isCorrect ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                          )}>
                            {res.isCorrect ? 'Correcto' : 'Fallido'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
