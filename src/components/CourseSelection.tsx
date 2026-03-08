import React, { useState } from 'react';
import { Route, ROUTES } from '@/src/types';
import { Map, ChevronRight, Info, Lock, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  onSelect: (route: Route) => void;
}

export default function CourseSelection({ onSelect }: Props) {
  const [showPasswordModal, setShowPasswordModal] = useState<Route | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleRouteClick = (route: Route) => {
    if (route.requiresPassword) {
      setShowPasswordModal(route);
    } else {
      onSelect(route);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '1234') {
      if (showPasswordModal) onSelect(showPasswordModal);
      setShowPasswordModal(null);
      setPassword('');
      setError(false);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-bold text-gray-900 tracking-tight">Selecciona tu Recorrido</h2>
        <p className="text-gray-500 mt-2">Elige el mapa y las balizas que vas a completar hoy.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {ROUTES.map((route) => (
          <button
            key={route.id}
            onClick={() => handleRouteClick(route)}
            className="group relative bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-emerald-200 transition-all text-left overflow-hidden active:scale-[0.98]"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Map className="w-24 h-24 rotate-12" />
            </div>
            
            <div className="relative z-10">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                {route.requiresPassword ? <Lock className="w-6 h-6" /> : <Map className="w-6 h-6" />}
              </div>
              
              <h3 className="text-xl font-black text-gray-900 mb-1 tracking-tight">{route.name}</h3>
              <div className="flex items-center gap-2 text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-4">
                <Info className="w-3 h-3" />
                <span>{route.balizas.length} balizas</span>
              </div>
              
              <div className="flex items-center text-emerald-600 font-black text-xs uppercase tracking-widest group-hover:gap-2 transition-all">
                {route.requiresPassword ? 'Acceso Restringido' : 'Empezar Carrera'}
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="text-center pt-8 border-t border-gray-100">
        <p className="text-gray-400 text-sm font-medium">
          © 2026 OrientaJC Pro • Sistema de Orientación Escolar
        </p>
      </div>

      {/* Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl"
            >
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mx-auto mb-6">
                <Key className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">Acceso al Recorrido 6</h3>
              <p className="text-gray-500 text-center mb-6">Este recorrido requiere una contraseña para acceder.</p>
              
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <input
                  autoFocus
                  type="password"
                  placeholder="Contraseña"
                  className={`w-full px-6 py-4 bg-gray-50 border-2 rounded-2xl text-center text-2xl font-bold tracking-widest outline-none transition-all ${
                    error ? 'border-red-500 bg-red-50' : 'border-gray-100 focus:border-emerald-500'
                  }`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(null)}
                    className="flex-1 py-4 px-6 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-emerald-200 transition-all"
                  >
                    Entrar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
