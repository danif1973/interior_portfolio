import fs from 'fs';
import path from 'path';
import { Project } from '@/data/projects';

export async function loadProjects(): Promise<Project[]> {
  console.log('Loading projects from server component');
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
    console.log('Found project directories:', projectDirs);

    // Load each project's data
    for (const projectDir of projectDirs) {
      const projectJsonPath = path.join(projectsDir, projectDir, 'project.json');
      console.log('Checking project:', projectDir);
      
      if (fs.existsSync(projectJsonPath)) {
        try {
          const projectData = JSON.parse(fs.readFileSync(projectJsonPath, 'utf-8'));
          console.log('Found project.json for:', projectDir);
          
          // Convert the project data to match the Project interface
          const project: Project = {
            id: projectDir.toLowerCase().replace(/\s+/g, '-'),
            title: projectData.title,
            summary: projectData.summary,
            description: projectData.description,
            mainImage: projectData.mainImage || projectData.images[0] || {
              url: '',
              alt: '',
              description: ''
            },
            images: projectData.images,
            directory: projectDir // Store the actual directory name
          };
          
          projects.push(project);
          console.log('Successfully loaded project:', project.title);
        } catch (error) {
          console.error(`Error loading project ${projectDir}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error loading projects:', error);
  }

  console.log('Loaded', projects.length, 'projects');
  return projects;
} 