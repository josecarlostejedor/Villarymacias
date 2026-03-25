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
}

export const ROUTES: Route[] = [
  {
    id: 1,
    name: "Recorrido 1",
    mapUrl: "https://raw.githubusercontent.com/josecarlostejedor/orientacion-villar-macias/main/Recorrido1.jpg", 
    balizas: [
      { id: 1, correctCode: "31", description: "Baliza 1" },
      { id: 2, correctCode: "32", description: "Baliza 2" },
      { id: 3, correctCode: "33", description: "Baliza 3" },
      { id: 4, correctCode: "34", description: "Baliza 4" },
      { id: 5, correctCode: "35", description: "Baliza 5" },
      { id: 6, correctCode: "36", description: "Baliza 6" },
    ],
  },
  {
    id: 2,
    name: "Recorrido 2",
    mapUrl: "https://raw.githubusercontent.com/josecarlostejedor/orientacion-villar-macias/main/Recorrido2.jpg",
    balizas: [
      { id: 1, correctCode: "37", description: "Baliza 1" },
      { id: 2, correctCode: "38", description: "Baliza 2" },
      { id: 3, correctCode: "39", description: "Baliza 3" },
      { id: 4, correctCode: "40", description: "Baliza 4" },
      { id: 5, correctCode: "41", description: "Baliza 5" },
      { id: 6, correctCode: "42", description: "Baliza 6" },
    ],
  },
  {
    id: 3,
    name: "Recorrido 3",
    mapUrl: "https://raw.githubusercontent.com/josecarlostejedor/orientacion-villar-macias/main/Recorrido3.jpg",
    balizas: [
      { id: 1, correctCode: "43", description: "Baliza 1" },
      { id: 2, correctCode: "44", description: "Baliza 2" },
      { id: 3, correctCode: "45", description: "Baliza 3" },
      { id: 4, correctCode: "46", description: "Baliza 4" },
      { id: 5, correctCode: "47", description: "Baliza 5" },
      { id: 6, correctCode: "48", description: "Baliza 6" },
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
