import React, { useState } from 'react';
import { UserData, COURSES, GROUPS } from '@/src/types';
import { User, Users, Calendar, GraduationCap, ChevronRight, MapPin, Activity, Map as MapIcon, Timer } from 'lucide-react';

interface Props {
  onSubmit: (data: UserData) => void;
}

export default function Home({ onSubmit }: Props) {
  const [formData, setFormData] = useState<UserData>({
    name: '',
    surname: '',
    age: 12,
    course: COURSES[0],
    group: GROUPS[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="max-w-md mx-auto space-y-8 pb-12">
      {/* Header Section */}
      <div className="text-center space-y-1">
        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">
          Recorridos de Orientación
        </h1>
        <div className="flex items-center justify-center gap-4">
          <div className="h-[1px] w-12 bg-emerald-200"></div>
          <h2 className="text-emerald-600 font-bold tracking-widest text-sm">
            IES LUCÍA DE MEDRANO
          </h2>
          <div className="h-[1px] w-12 bg-emerald-200"></div>
        </div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
          Departamento de Educación Física
        </p>
      </div>

      {/* Hero Image Card */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-emerald-500/20 rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative bg-white rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white aspect-[4/3]">
          <img
            src="https://raw.githubusercontent.com/josecarlostejedor/Villarymacias/main/recorridoorienta.jpg"
            alt="Localización"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
          <div className="absolute bottom-6 left-6 text-white">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> LOCALIZACIÓN
            </p>
            <h3 className="text-xl font-bold leading-tight">
              Parque Villar y Macías, <span className="font-normal opacity-90">Salamanca.</span>
            </h3>
          </div>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="text-center px-4">
        <p className="text-emerald-700 font-black text-lg leading-tight">
          ¡Bienvenidos a nuestra práctica de orientación en entorno próximo!
        </p>
      </div>

      {/* Form Section */}
      <div className="bg-white rounded-[2rem] p-8 shadow-2xl border border-gray-100 space-y-6">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Registro</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Nombre</label>
              <input
                required
                type="text"
                placeholder="Nombre"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none font-medium placeholder:text-gray-300"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Apellidos</label>
              <input
                required
                type="text"
                placeholder="Apellidos"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none font-medium placeholder:text-gray-300"
                value={formData.surname}
                onChange={e => setFormData({ ...formData, surname: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Edad</label>
              <input
                required
                type="number"
                placeholder="12"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none font-medium placeholder:text-gray-300"
                value={formData.age}
                onChange={e => setFormData({ ...formData, age: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Grupo</label>
              <div className="relative">
                <select
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none font-medium appearance-none"
                  value={formData.group}
                  onChange={e => setFormData({ ...formData, group: e.target.value })}
                >
                  {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Curso</label>
            <div className="relative">
              <select
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none font-medium appearance-none"
                value={formData.course}
                onChange={e => setFormData({ ...formData, course: e.target.value })}
              >
                {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-6 rounded-2xl shadow-xl shadow-emerald-200 transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
        >
          Comenzar Carrera
        </button>
      </div>

      {/* Footer Section */}
      <div className="pt-8 text-center space-y-4 border-t border-gray-100">
        <div className="flex items-center justify-center gap-6 text-gray-300">
          <Activity className="w-5 h-5" />
          <MapIcon className="w-5 h-5" />
          <Timer className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
            © 2026 OrientaJC Pro • Sistema de Orientación Escolar
          </p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            App creada por J.C. Tejedor
          </p>
        </div>
      </div>
    </div>
  );
}
