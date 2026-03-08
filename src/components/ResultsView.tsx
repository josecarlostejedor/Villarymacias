import { UserData, Route } from '@/src/types';
import { Trophy, Download, RotateCcw, CheckCircle2, Clock, Map as MapIcon, Activity } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Props {
  userData: UserData;
  route: Route;
  time: number;
  responses: { balizaId: number; code: string }[];
  borgScale: number;
  onRestart: () => void;
}

export default function ResultsView({ userData, route, time, responses, borgScale, onRestart }: Props) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const normalizeCode = (code: string) => {
    return code
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/\s+/g, ""); // Remove all spaces
  };

  const calculateScore = () => {
    let score = 0;
    responses.forEach((resp) => {
      const baliza = route.balizas.find((b) => b.id === resp.balizaId);
      if (baliza && normalizeCode(resp.code) === normalizeCode(baliza.code)) {
        score++;
      }
    });
    return score;
  };

  const score = calculateScore();

  const generatePDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    const addFooter = (pageNum: number) => {
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text('Aprendiendo orientación en clase de Educación Física', pageWidth / 2, pageHeight - 10, { align: 'center' });
      doc.text(`Página ${pageNum}`, pageWidth - 20, pageHeight - 10);
    };

    // Header
    doc.setFillColor(16, 185, 129); // Emerald 500
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text('Recorridos de Orientación en el IES Lucía de Medrano', pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(14);
    doc.text('DEPARTAMENTO DE EDUCACIÓN FÍSICA', pageWidth / 2, 25, { align: 'center' });
    doc.setFontSize(10);
    doc.text('(App creada por Jose Carlos Tejedor)', pageWidth / 2, 35, { align: 'center' });
    
    // Report Date
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Fecha de emisión del informe: ${new Date().toLocaleString()}`, 20, 55);
    
    // User Info
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL CORREDOR:', 20, 65);
    doc.setFont('helvetica', 'normal');
    
    const userInfo = [
      ['1- Nombre completo', `${userData.name} ${userData.surname}`],
      ['2- Edad', `${userData.age} años`],
      ['3- Recorrido', route.name],
      ['4- Tiempo Total', formatTime(time)],
      ['5- Curso', userData.course],
      ['6- Grupo', userData.group],
      ['7- Puntuación Total', `${score} / ${route.balizas.length}`],
      ['8- Escala de Borg', `${borgScale}`],
    ];
    
    autoTable(doc, {
      startY: 70,
      body: userInfo,
      theme: 'plain',
      styles: { fontSize: 11, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } }
    });
    
    // Baliza Breakdown
    const breakdownY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Desglose de las Balizas:', 20, breakdownY);
    
    const balizaDetails = route.balizas.map((b, i) => {
      const resp = responses.find(r => r.balizaId === b.id);
      const isCorrect = resp && normalizeCode(resp.code) === normalizeCode(b.code);
      return [
        b.description,
        resp ? resp.code : '-',
        isCorrect ? 'Acertado' : 'Fallado'
      ];
    });

    autoTable(doc, {
      startY: breakdownY + 5,
      head: [['Descripción de la Baliza', 'Código ingresado', 'Resultado']],
      body: balizaDetails,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
      styles: { fontSize: 10 }
    });

    addFooter(1);

    // Map Page
    doc.addPage();
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('MAPA DEL RECORRIDO:', 20, 20);
    
    try {
      doc.addImage(route.mapUrl, 'JPEG', 20, 30, pageWidth - 40, (pageWidth - 40) * 1.3);
    } catch (e) {
      doc.setFontSize(10);
      doc.setTextColor(255, 0, 0);
      doc.text('No se pudo cargar la imagen del mapa en el PDF.', 20, 40);
      doc.text(`URL: ${route.mapUrl}`, 20, 50);
    }

    addFooter(2);
    
    doc.save(`Reporte_${userData.surname}_${route.name.replace(' ', '_')}.pdf`);
  };

  return (
    <div className="max-w-2xl mx-auto px-2 sm:px-4">
      <div className="bg-white rounded-[2rem] sm:rounded-3xl shadow-2xl overflow-hidden border border-black/5">
        <div className="bg-emerald-600 p-6 sm:p-10 text-center text-white relative">
          <div className="relative z-10">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">¡Carrera Finalizada!</h2>
            <p className="text-emerald-100 mt-1 sm:mt-2 text-sm sm:text-lg font-medium">Excelente trabajo, {userData.name}.</p>
          </div>
        </div>
        
        <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-gray-50 p-3 sm:p-4 rounded-2xl text-center border border-gray-100">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 mx-auto mb-1 sm:mb-2" />
              <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-400">Tiempo</p>
              <p className="text-lg sm:text-xl font-mono font-bold text-gray-900">{formatTime(time)}</p>
            </div>
            
            <div className="bg-gray-50 p-3 sm:p-4 rounded-2xl text-center border border-gray-100">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mx-auto mb-1 sm:mb-2" />
              <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-400">Puntos</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">{score} / {route.balizas.length}</p>
            </div>

            <div className="bg-gray-50 p-3 sm:p-4 rounded-2xl text-center border border-gray-100">
              <MapIcon className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 mx-auto mb-1 sm:mb-2" />
              <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-400">Recorrido</p>
              <p className="text-sm sm:text-lg font-bold text-gray-900 truncate">{route.name}</p>
            </div>
 
            <div className="bg-gray-50 p-3 sm:p-4 rounded-2xl text-center border border-gray-100">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 mx-auto mb-1 sm:mb-2" />
              <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-400">Borg</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">{borgScale}</p>
            </div>
          </div>
 
          <div className="space-y-4">
            <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Resumen del Corredor</h3>
            <div className="bg-gray-50 rounded-[1.5rem] sm:rounded-2xl p-4 sm:p-6 border border-gray-100 space-y-4">
              <div className="flex justify-between items-start text-sm sm:text-base">
                <span className="text-gray-500 font-medium">Nombre</span>
                <span className="font-black text-gray-900 text-right leading-tight max-w-[60%]">{userData.name} {userData.surname}</span>
              </div>
              <div className="flex justify-between items-center text-sm sm:text-base">
                <span className="text-gray-500 font-medium">Curso / Grupo</span>
                <span className="font-black text-gray-900">{userData.course} • {userData.group}</span>
              </div>
              <div className="flex justify-between items-center text-sm sm:text-base">
                <span className="text-gray-500 font-medium">Edad</span>
                <span className="font-black text-gray-900">{userData.age} años</span>
              </div>
            </div>
          </div>
 
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4">
            <button
              onClick={generatePDF}
              className="flex-1 bg-gray-900 hover:bg-black text-white font-bold py-4 px-6 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Download className="w-5 h-5" />
              <span className="text-sm sm:text-base">Imprimir Registro</span>
            </button>
            
            <button
              onClick={onRestart}
              className="flex-1 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200 font-bold py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <RotateCcw className="w-5 h-5" />
              <span className="text-sm sm:text-base">Nueva Carrera</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
