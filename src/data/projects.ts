import fs from 'fs';
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
            id: projectDir.toLowerCase().replace(/\s+/g, '-'),
            title: projectData.name,
            summary: `A collection of interior design images from ${projectData.name}`,
            description: `This project showcases various interior design elements and styles from ${projectData.name}. Each image captures different aspects of the space, highlighting the attention to detail and design choices.`,
            mainImage: projectData.images[0] || {
              url: '',
              alt: '',
              description: ''
            },
            images: projectData.images
          };
          
          projects.push(project);
        } catch (error) {
          console.error(`Error loading project ${projectDir}:`, error);
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
