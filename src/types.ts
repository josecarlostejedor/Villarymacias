export interface UserData {
  name: string;
  surname: string;
  age: number;
  course: string;
  group: string;
}

export interface Baliza {
  id: number;
  code: string; // This is the correct answer
  description: string;
}

export interface Route {
  id: number;
  name: string;
  mapUrl: string;
  balizas: Baliza[];
  requiresPassword?: boolean;
}

export const COURSES = [
  "1º ESO",
  "2º ESO",
  "3º ESO",
  "1º BACHILLERATO",
  "2º BACHILLERATO",
  "FP BÁSICA",
  "Otro nivel educativo"
];

export const GROUPS = ["1", "2", "3", "4", "5", "6", "7", "8"];

export const ROUTES: Route[] = [
  {
    id: 1,
    name: "Recorrido 1",
    mapUrl: "https://raw.githubusercontent.com/josecarlostejedor/VillarymaciasOrientacion/main/Recorrido1VM.jpg",
    balizas: [
      { id: 1, code: "Pizarra Santibañez", description: "Baliza 1" },
      { id: 2, code: "1395-007", description: "Baliza 2" },
      { id: 3, code: "1395-043", description: "Baliza 3" },
      { id: 4, code: "1395-031", description: "Baliza 4" },
      { id: 5, code: "1395-022", description: "Baliza 5" },
      { id: 6, code: "1395-013", description: "Baliza 6" },
      { id: 7, code: "Jardín Geobotánico", description: "Baliza 7" },
      { id: 8, code: "Haya", description: "Baliza 8" },
    ]
  },
  {
    id: 2,
    name: "Recorrido 2",
    mapUrl: "https://raw.githubusercontent.com/josecarlostejedor/VillarymaciasOrientacion/main/Recorrido2VM.jpg",
    balizas: [
      { id: 1, code: "Pizarra Santibañez", description: "Baliza 1" },
      { id: 2, code: "1395-031", description: "Baliza 2" },
      { id: 3, code: "1395-026", description: "Baliza 3" },
      { id: 4, code: "1395-001", description: "Baliza 4" },
      { id: 5, code: "1395-021", description: "Baliza 5" },
      { id: 6, code: "Magnolio", description: "Baliza 6" },
      { id: 7, code: "1395-055", description: "Baliza 7" },
      { id: 8, code: "Alba & Andrea", description: "Baliza 8" },
    ]
  },
  {
    id: 3,
    name: "Recorrido 3",
    mapUrl: "https://raw.githubusercontent.com/josecarlostejedor/VillarymaciasOrientacion/main/Recorrido3VM.jpg",
    balizas: [
      { id: 1, code: "1395-067", description: "Baliza 1" },
      { id: 2, code: "Haya", description: "Baliza 2" },
      { id: 3, code: "1395-041", description: "Baliza 3" },
      { id: 4, code: "1395-018", description: "Baliza 4" },
      { id: 5, code: "1395-013", description: "Baliza 5" },
      { id: 6, code: "1395-022", description: "Baliza 6" },
      { id: 7, code: "1395-044", description: "Baliza 7" },
      { id: 8, code: "Paseo del Brezo", description: "Baliza 8" },
    ]
  },
  {
    id: 4,
    name: "Recorrido 4",
    mapUrl: "https://raw.githubusercontent.com/josecarlostejedor/VillarymaciasOrientacion/main/Recorrido4VM.jpg",
    balizas: [
      { id: 1, code: "1395-054", description: "Baliza 1" },
      { id: 2, code: "1395-041", description: "Baliza 2" },
      { id: 3, code: "1395-022", description: "Baliza 3" },
      { id: 4, code: "Jardín Geobotánico", description: "Baliza 4" },
      { id: 5, code: "1395-021", description: "Baliza 5" },
      { id: 6, code: "1395-044", description: "Baliza 6" },
      { id: 7, code: "Ligustrum Variegata", description: "Baliza 7" },
      { id: 8, code: "Paseo del Brezo", description: "Baliza 8" },
    ]
  },
  {
    id: 5,
    name: "Recorrido 5",
    mapUrl: "https://raw.githubusercontent.com/josecarlostejedor/VillarymaciasOrientacion/main/Recorrrido5VM.jpg",
    balizas: [
      { id: 1, code: "Pizarra Santibañez", description: "Baliza 1" },
      { id: 2, code: "1395-067", description: "Baliza 2" },
      { id: 3, code: "Haya", description: "Baliza 3" },
      { id: 4, code: "1395-041", description: "Baliza 4" },
      { id: 5, code: "1395-031", description: "Baliza 5" },
      { id: 6, code: "1395-083", description: "Baliza 6" },
      { id: 7, code: "1395-021", description: "Baliza 7" },
      { id: 8, code: "1395-044", description: "Baliza 8" },
      { id: 9, code: "Alba & Andrea", description: "Baliza 9" },
    ]
  },
  {
    id: 6,
    name: "Recorrido 6",
    mapUrl: "https://raw.githubusercontent.com/josecarlostejedor/VillarymaciasOrientacion/main/Recorrido6VM.jpg",
    requiresPassword: true,
    balizas: [
      { id: 1, code: "Pizarra Santibañez", description: "Baliza 1" },
      { id: 2, code: "1395-041", description: "Baliza 2" },
      { id: 3, code: "Haya", description: "Baliza 3" },
      { id: 4, code: "1395-031", description: "Baliza 4" },
      { id: 5, code: "1395-022", description: "Baliza 5" },
      { id: 6, code: "1395-083", description: "Baliza 6" },
      { id: 7, code: "1395-013", description: "Baliza 7" },
      { id: 8, code: "1395-001", description: "Baliza 8" },
      { id: 9, code: "1395-021", description: "Baliza 9" },
      { id: 10, code: "1395-044", description: "Baliza 10" },
      { id: 11, code: "Paseo del Brezo", description: "Baliza 11" },
    ]
  }
];
