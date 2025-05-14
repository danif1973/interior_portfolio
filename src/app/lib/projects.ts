import fs from 'fs';
import path from 'path';
import { Project } from '@/data/projects';

export async function getProjects(): Promise<Project[]> {
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
            summary: projectData.summary || '',
            description: projectData.description || '',
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
} 