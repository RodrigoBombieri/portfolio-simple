export interface Tech {
  name: string;
  category: string;
}

// Lista curada: se evitan entradas redundantes (Git ya está implícito en
// GitHub) o demasiado básicas (HTML/CSS) para que el loop del marquee no
// se vuelva pesado de leer.
export const TECHNOLOGIES: Tech[] = [
  { name: "C#", category: "Lenguaje" },
  { name: ".NET", category: "Framework" },
  { name: "ASP.NET Core", category: "Framework" },
  { name: "SQL Server", category: "Base de datos" },
  { name: "Angular", category: "Frontend" },
  { name: "Astro", category: "Frontend" },
  { name: "Node.js", category: "Runtime" },
  { name: "JavaScript", category: "Lenguaje" },
  { name: "Docker", category: "DevOps" },
  { name: "Azure", category: "Cloud" },
  { name: "GitHub", category: "DevOps" },
  { name: "Python", category: "Lenguaje" },
  { name: "OpenAI", category: "IA" },
  { name: "ROS2", category: "Robótica" },
  { name: "Flutter", category: "Mobile" },
  { name: "PostgreSQL", category: "Base de datos" },
];
