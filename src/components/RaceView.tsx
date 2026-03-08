import React, { useState, useEffect, useRef } from 'react';
import { Route, Baliza } from '@/src/types';
import QuickPinchZoom, { make3dTransformValue } from 'react-quick-pinch-zoom';
import { Timer, CheckCircle2, XCircle, Map as MapIcon, ChevronRight, Flag, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  route: Route;
  onFinish: (time: number, responses: { balizaId: number; code: string }[], borgScale: number) => void;
}

const BORG_SCALE = [
  { value: 6, label: "Reposo total", color: "bg-blue-500" },
  { value: 7, label: "Extremadamente suave", color: "bg-blue-400" },
  { value: 8, label: "Muy suave", color: "bg-emerald-400" },
  { value: 9, label: "Muy suave", color: "bg-emerald-500" },
  { value: 10, label: "Suave", color: "bg-emerald-600" },
  { value: 11, label: "Suave", color: "bg-emerald-700" },
  { value: 12, label: "Algo pesado", color: "bg-amber-400" },
  { value: 13, label: "Algo pesado", color: "bg-amber-500" },
  { value: 14, label: "Pesado", color: "bg-amber-600" },
  { value: 15, label: "Pesado", color: "bg-orange-500" },
  { value: 16, label: "Muy pesado", color: "bg-orange-600" },
  { value: 17, label: "Muy pesado", color: "bg-red-500" },
  { value: 18, label: "Extremadamente pesado", color: "bg-red-600" },
  { value: 19, label: "Extremadamente pesado", color: "bg-red-700" },
  { value: 20, label: "Esfuerzo máximo", color: "bg-gray-900" },
];

export default function RaceView({ route, onFinish }: Props) {
  const [time, setTime] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [currentBalizaIndex, setCurrentBalizaIndex] = useState(0);
  const [inputCode, setInputCode] = useState('');
  const [responses, setResponses] = useState<{ balizaId: number; code: string }[]>([]);
  const [showBorgScale, setShowBorgScale] = useState(false);
  const [borgValue, setBorgValue] = useState(13);
  
  const imgRef = useRef<HTMLDivElement>(null);
  const onUpdate = React.useCallback(({ x, y, scale }: { x: number; y: number; scale: number }) => {
    if (imgRef.current) {
      const value = make3dTransformValue({ x, y, scale });
      imgRef.current.style.setProperty('transform', value);
    }
  }, []);

  useEffect(() => {
    if (imgRef.current) {
      imgRef.current.style.setProperty('transform-origin', '0 0');
    }
  }, []);

  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        setTime((time) => time + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBalizaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentBaliza = route.balizas[currentBalizaIndex];
    
    const newResponses = [...responses, { balizaId: currentBaliza.id, code: inputCode }];
    setResponses(newResponses);
    setInputCode('');
    
    if (currentBalizaIndex < route.balizas.length - 1) {
      setCurrentBalizaIndex(currentBalizaIndex + 1);
    } else {
      setIsActive(false);
      setShowBorgScale(true);
    }
  };

  const handleBorgFinish = () => {
    onFinish(time, responses, borgValue);
  };

  const currentBaliza = route.balizas[currentBalizaIndex];
  const currentBorg = BORG_SCALE.find(b => b.value === borgValue) || BORG_SCALE[7];

  if (showBorgScale) {
    return (
      <div className="max-w-xl mx-auto space-y-12 py-12 px-4">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto text-emerald-600 shadow-inner">
            <Activity className="w-12 h-12" />
          </div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight">Escala de Borg</h2>
          <p className="text-gray-500 font-medium">Desliza para indicar tu nivel de esfuerzo subjetivo.</p>
        </div>

        <div className="space-y-12 bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100">
          <div className="text-center space-y-2">
            <motion.div 
              key={borgValue}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`inline-block px-8 py-4 rounded-3xl text-4xl font-black text-white shadow-lg ${currentBorg.color}`}
            >
              {borgValue}
            </motion.div>
            <p className="text-xl font-bold text-gray-800 uppercase tracking-wide pt-4">
              {currentBorg.label}
            </p>
          </div>

          <div className="relative pt-6 pb-2">
            <input
              type="range"
              min="6"
              max="20"
              step="1"
              value={borgValue}
              onChange={(e) => setBorgValue(parseInt(e.target.value))}
              className="w-full h-4 rounded-full appearance-none cursor-pointer borg-slider-track"
            />
            <div className="flex justify-between mt-6 text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
              <span>Mínimo (6)</span>
              <span>Máximo (20)</span>
            </div>
          </div>

          <button
            onClick={handleBorgFinish}
            className="w-full bg-gray-900 hover:bg-black text-white font-bold py-5 px-6 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
          >
            Finalizar Carrera
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-5xl mx-auto gap-4">
      {/* Header Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <Timer className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Tiempo</p>
            <p className="text-xl font-mono font-bold text-gray-900">{formatTime(time)}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <Flag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Progreso</p>
            <p className="text-xl font-bold text-gray-900">{currentBalizaIndex + 1} / {route.balizas.length}</p>
          </div>
        </div>

        <div className="hidden md:flex col-span-2 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
            <MapIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Baliza Actual</p>
            <p className="text-sm font-medium text-gray-900">{currentBaliza.description}</p>
          </div>
        </div>
      </div>

      {/* Map Area - Integrated without black background */}
      <div className="flex-1 bg-white rounded-[2.5rem] overflow-hidden relative border-4 border-white shadow-2xl ring-1 ring-gray-100 group/map">
        <QuickPinchZoom 
          onUpdate={onUpdate} 
          draggableUnZoomed={false}
          containerProps={{ 
            className: 'w-full h-full',
            style: { touchAction: 'none' }
          }}
        >
          <div ref={imgRef} className="w-full h-full will-change-transform">
            <img
              src={route.mapUrl}
              alt="Mapa de orientación"
              className="w-full h-full object-contain block select-none"
              referrerPolicy="no-referrer"
              draggable={false}
            />
          </div>
        </QuickPinchZoom>
        
        {/* Zoom Hint */}
        <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md p-2 rounded-xl shadow-sm border border-white/20 pointer-events-none opacity-0 group-hover/map:opacity-100 transition-opacity hidden md:flex items-center gap-2">
          <MapIcon className="w-4 h-4 text-gray-400" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Usa dos dedos para hacer zoom</span>
        </div>
        
        {/* Mobile Baliza Description Overlay */}
        <div className="absolute bottom-4 left-4 right-4 md:hidden">
          <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/20">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Objetivo actual</p>
            <p className="text-base font-black text-gray-900">{currentBaliza.description}</p>
          </div>
        </div>
      </div>

      {/* Baliza Input Area */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-gray-100">
        <form onSubmit={handleBalizaSubmit} className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 ml-2">
              Código de la Baliza #{currentBalizaIndex + 1}
            </label>
            <div className="relative">
              <input
                autoFocus
                type="text"
                className="w-full px-8 py-5 bg-gray-50 border-2 border-gray-50 rounded-2xl text-2xl font-mono font-bold tracking-widest outline-none transition-all focus:border-emerald-500 focus:bg-white"
                placeholder="CÓDIGO"
                value={inputCode}
                onChange={e => setInputCode(e.target.value)}
              />
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-5 px-12 rounded-2xl shadow-xl shadow-emerald-200 transition-all flex items-center justify-center gap-2 h-full self-end active:scale-[0.98]"
          >
            Siguiente
            <ChevronRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
