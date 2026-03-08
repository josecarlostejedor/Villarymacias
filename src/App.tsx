import { useState } from 'react';
import { UserData, Route } from '@/src/types';
import Home from '@/src/components/Home';
import CourseSelection from '@/src/components/CourseSelection';
import RaceView from '@/src/components/RaceView';
import ResultsView from '@/src/components/ResultsView';
import { Compass } from 'lucide-react';

type AppState = 'home' | 'selection' | 'race' | 'results';

export default function App() {
  const [state, setState] = useState<AppState>('home');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [finalTime, setFinalTime] = useState<number>(0);
  const [responses, setResponses] = useState<{ balizaId: number; code: string }[]>([]);
  const [borgScale, setBorgScale] = useState<number>(0);

  const handleHomeSubmit = (data: UserData) => {
    setUserData(data);
    setState('selection');
  };

  const handleRouteSelection = (route: Route) => {
    setSelectedRoute(route);
    setState('race');
  };

  const handleRaceFinish = async (time: number, resps: { balizaId: number; code: string }[], borg: number) => {
    setFinalTime(time);
    setResponses(resps);
    setBorgScale(borg);
    setState('results');

    // Save to backend
    if (userData && selectedRoute) {
      try {
        await fetch('/api/results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...userData,
            routeId: selectedRoute.id,
            totalTime: time,
            responses: resps,
            borgScale: borg
          })
        });
      } catch (error) {
        console.error('Failed to save results to server:', error);
      }
    }
  };

  const handleRestart = () => {
    setState('home');
    setUserData(null);
    setSelectedRoute(null);
    setFinalTime(0);
    setResponses([]);
    setBorgScale(0);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-gray-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Navigation / Header */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">Orienta<span className="text-emerald-600">JC Pro</span></span>
          </div>
          
          {userData && (
            <div className="hidden sm:flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Corredor</p>
                <p className="text-sm font-bold text-gray-900">{userData.name} {userData.surname}</p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold">
                {userData.name[0]}{userData.surname[0]}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {state === 'home' && (
          <Home onSubmit={handleHomeSubmit} />
        )}
        
        {state === 'selection' && (
          <CourseSelection onSelect={handleRouteSelection} />
        )}
        
        {state === 'race' && selectedRoute && (
          <RaceView route={selectedRoute} onFinish={handleRaceFinish} />
        )}
        
        {state === 'results' && userData && selectedRoute && (
          <ResultsView
            userData={userData}
            route={selectedRoute}
            time={finalTime}
            responses={responses}
            borgScale={borgScale}
            onRestart={handleRestart}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-400 text-sm">
        <p>&copy; {new Date().getFullYear()} OrientaJC Pro • Sistema de Orientación Escolar</p>
      </footer>
    </div>
  );
}
