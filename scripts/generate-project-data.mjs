import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECTS_DIR = path.join(path.dirname(__dirname), 'public', 'Images', 'Projects');

function generateProjectData() {
  const projects = [];
  
  // Read all project directories
  const projectDirs = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  projectDirs.forEach((dirName) => {
    const projectDir = path.join(PROJECTS_DIR, dirName);
    const projectJsonPath = path.join(projectDir, 'project.json');
    
    if (fs.existsSync(projectJsonPath)) {
      try {
        const projectData = JSON.parse(fs.readFileSync(projectJsonPath, 'utf-8'));
        projects.push(projectData);
      } catch (error) {
        console.error(`Error loading project ${dirName}:`, error);
      }
    }
  });

  return projects;
}

// Generate the project data
const projects = generateProjectData();

// Write to the projects.ts file
const outputPath = path.join(path.dirname(__dirname), 'src', 'data', 'projects.ts');
const fileContent = `import fs from 'fs';
import path from 'path';

export interface Project {
  id: string;
  title: string;
  summary: string;
  description: string;
  mainImage: {
    url: string;
    alt: string;
    description: string;
  };
  images: Array<{
    url: string;
    alt: string;
    description: string;
  }>;
}

const loadProjects = (): Project[] => {
  const projects: Project[] = [];
  const projectsDir = path.join(process.cwd(), 'public', 'Images', 'Projects');

  try {
    // Check if the projects directory exists
    if (!fs.existsSync(projectsDir)) {
      console.log('Projects directory not found');
      return projects;
    }

    // Get all project directories
    const projectDirs = fs.readdirSync(projectsDir);

    // Load each project's data
    for (const projectDir of projectDirs) {
      const projectJsonPath = path.join(projectsDir, projectDir, 'project.json');
      
      if (fs.existsSync(projectJsonPath)) {
        try {
          const projectData = JSON.parse(fs.readFileSync(projectJsonPath, 'utf-8'));
          
          // Convert the project data to match the Project interface
          const project: Project = {
            id: projectDir.toLowerCase().replace(/\\s+/g, '-'),
            title: projectData.name,
            summary: \`A collection of interior design images from \${projectData.name}\`,
            description: \`This project showcases various interior design elements and styles from \${projectData.name}. Each image captures different aspects of the space, highlighting the attention to detail and design choices.\`,
            mainImage: projectData.images[0] || {
              url: '',
              alt: '',
              description: ''
            },
            images: projectData.images
          };
          
          projects.push(project);
        } catch (error) {
          console.error(\`Error loading project \${projectDir}:\`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error loading projects:', error);
  }

  return projects;
};

// Load projects from filesystem
export const projects = loadProjects();
`;

fs.writeFileSync(outputPath, fileContent);
console.log('Project data loading code has been generated successfully!'); 