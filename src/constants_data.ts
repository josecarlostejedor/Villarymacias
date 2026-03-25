export interface Baliza {
  id: number;
  correctCode: string;
  description: string;
}

export interface Route {
  id: number;
  name: string;
  mapUrl: string;
  balizas: Baliza[];
  accessCode?: string;
}

export const ROUTES: Route[] = [
  {
    id: 1,
    name: "Recorrido 1",
    mapUrl: "https://raw.githubusercontent.com/josecarlostejedor/Villarymacias/main/Recorrido1VM.jpg", 
    balizas: [
      { id: 1, correctCode: "Pizarra Santibañez", description: "Baliza 1" },
      { id: 2, correctCode: "1395-007", description: "Baliza 2" },
      { id: 3, correctCode: "1395-043", description: "Baliza 3" },
      { id: 4, correctCode: "1395-031", description: "Baliza 4" },
      { id: 5, correctCode: "1395-022", description: "Baliza 5" },
      { id: 6, correctCode: "1395-013", description: "Baliza 6" },
      { id: 7, correctCode: "Jardín Geobotánico", description: "Baliza 7" },
      { id: 8, correctCode: "Haya", description: "Baliza 8" },
    ],
  },
  {
    id: 2,
    name: "Recorrido 2",
    mapUrl: "https://raw.githubusercontent.com/josecarlostejedor/Villarymacias/main/Recorrido2VM.jpg",
    balizas: [
      { id: 1, correctCode: "Pizarra Santibañez", description: "Baliza 1" },
      { id: 2, correctCode: "1395-031", description: "Baliza 2" },
      { id: 3, correctCode: "1395-026", description: "Baliza 3" },
      { id: 4, correctCode: "1395-001", description: "Baliza 4" },
      { id: 5, correctCode: "1395-021", description: "Baliza 5" },
      { id: 6, correctCode: "Magnolio", description: "Baliza 6" },
      { id: 7, correctCode: "1395-055", description: "Baliza 7" },
      { id: 8, correctCode: "Alba & Andrea", description: "Baliza 8" },
    ],
  },
  {
    id: 3,
    name: "Recorrido 3",
    mapUrl: "https://raw.githubusercontent.com/josecarlostejedor/Villarymacias/main/Recorrido3VM.jpg",
    balizas: [
      { id: 1, correctCode: "1395-067", description: "Baliza 1" },
      { id: 2, correctCode: "Haya", description: "Baliza 2" },
      { id: 3, correctCode: "1395-041", description: "Baliza 3" },
      { id: 4, correctCode: "1395-018", description: "Baliza 4" },
      { id: 5, correctCode: "1395-013", description: "Baliza 5" },
      { id: 6, correctCode: "1395-022", description: "Baliza 6" },
      { id: 7, correctCode: "1395-044", description: "Baliza 7" },
      { id: 8, correctCode: "Paseo del Brezo", description: "Baliza 8" },
    ],
  },
  {
    id: 4,
    name: "Recorrido 4",
    mapUrl: "https://raw.githubusercontent.com/josecarlostejedor/Villarymacias/main/Recorrido4VM.jpg",
    balizas: [
      { id: 1, correctCode: "1395-054", description: "Baliza 1" },
      { id: 2, correctCode: "1395-041", description: "Baliza 2" },
      { id: 3, correctCode: "1395-022", description: "Baliza 3" },
      { id: 4, correctCode: "Jardín Geobotánico", description: "Baliza 4" },
      { id: 5, correctCode: "1395-021", description: "Baliza 5" },
      { id: 6, correctCode: "1395-044", description: "Baliza 6" },
      { id: 7, correctCode: "Ligustrum Variegata", description: "Baliza 7" },
      { id: 8, correctCode: "Paseo del Brezo", description: "Baliza 8" },
    ],
  },
  {
    id: 5,
    name: "Recorrido 5",
    mapUrl: "https://raw.githubusercontent.com/josecarlostejedor/Villarymacias/main/Recorrrido5VM.jpg",
    balizas: [
      { id: 1, correctCode: "Pizarra Santibañez", description: "Baliza 1" },
      { id: 2, correctCode: "1395-067", description: "Baliza 2" },
      { id: 3, correctCode: "Haya", description: "Baliza 3" },
      { id: 4, correctCode: "1395-041", description: "Baliza 4" },
      { id: 5, correctCode: "1395-031", description: "Baliza 5" },
      { id: 6, correctCode: "1395-083", description: "Baliza 6" },
      { id: 7, correctCode: "1395-021", description: "Baliza 7" },
      { id: 8, correctCode: "1395-044", description: "Baliza 8" },
      { id: 9, correctCode: "Alba & Andrea", description: "Baliza 9" },
    ],
  },
  {
    id: 6,
    name: "Recorrido 6",
    mapUrl: "https://raw.githubusercontent.com/josecarlostejedor/Villarymacias/main/Recorrido6VM.jpg",
    accessCode: "1234",
    balizas: [
      { id: 1, correctCode: "Pizarra Santibañez", description: "Baliza 1" },
      { id: 2, correctCode: "1395-041", description: "Baliza 2" },
      { id: 3, correctCode: "Haya", description: "Baliza 3" },
      { id: 4, correctCode: "1395-031", description: "Baliza 4" },
      { id: 5, correctCode: "1395-022", description: "Baliza 5" },
      { id: 6, correctCode: "1395-083", description: "Baliza 6" },
      { id: 7, correctCode: "1395-013", description: "Baliza 7" },
      { id: 8, correctCode: "1395-001", description: "Baliza 8" },
      { id: 9, correctCode: "1395-021", description: "Baliza 9" },
      { id: 10, correctCode: "1395-044", description: "Baliza 10" },
      { id: 11, correctCode: "Paseo del Brezo", description: "Baliza 11" },
    ],
  },
];

export const COURSES = [
  "1º ESO",
  "2º ESO",
  "3º ESO",
  "1º BACHILLERATO",
  "2º BACHILLERATO",
  "FP BÁSICA",
  "Otro nivel educativo",
];

export const GROUPS = ["1", "2", "3", "4", "5", "6", "7", "8"];
