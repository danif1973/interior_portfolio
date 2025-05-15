import fs from 'fs';
import path from 'path';
import { Project } from '@/types/project';

export async function loadProjects(): Promise<Project[]> {
  console.log('=== Starting Project Load ===');
  console.log('Current working directory:', process.cwd());
  const projects: Project[] = [];
  const projectsDir = path.join(process.cwd(), 'public', 'Images', 'Projects');
  console.log('Looking for projects in:', projectsDir);

  try {
    // Check if the projects directory exists
    if (!fs.existsSync(projectsDir)) {
      console.error('❌ Projects directory not found at:', projectsDir);
      return projects;
    }
    console.log('✅ Projects directory found');

    // Get all project directories
    const projectDirs = fs.readdirSync(projectsDir);
    console.log('📁 Found project directories:', projectDirs);

    // Load each project's data
    for (const projectDir of projectDirs) {
      const projectJsonPath = path.join(projectsDir, projectDir, 'project.json');
      console.log('\n🔍 Processing project:', projectDir);
      console.log('Looking for project.json at:', projectJsonPath);
      
      if (fs.existsSync(projectJsonPath)) {
        try {
          const projectData = JSON.parse(fs.readFileSync(projectJsonPath, 'utf-8'));
          console.log('📄 Found project.json for:', projectDir);
          console.log('Project data:', JSON.stringify(projectData, null, 2));
          
          // Convert the project data to match the Project interface
          const images = Array.isArray(projectData.images) ? projectData.images : [];
          console.log('📸 Found images:', images.length);
          
          const mainImage = projectData.mainImage || images[0] || {
            url: '',
            alt: '',
            description: ''
          };
          console.log('🖼️ Main image:', mainImage);

          const project: Project = {
            id: typeof projectData.id === 'string' ? projectData.id : projectDir.toLowerCase().replace(/\s+/g, '-'),
            title: typeof projectData.title === 'string' ? projectData.title : '',
            summary: typeof projectData.summary === 'string' ? projectData.summary : '',
            description: typeof projectData.description === 'string' ? projectData.description : '',
            mainImage,
            images,
            directory: projectDir
          };
          
          projects.push(project);
          console.log('✅ Successfully loaded project:', project.title);
          console.log('Project details:', {
            id: project.id,
            title: project.title,
            imageCount: project.images.length,
            mainImageUrl: project.mainImage.url
          });
        } catch (error) {
          console.error(`❌ Error loading project ${projectDir}:`, error);
        }
      } else {
        console.warn(`⚠️ project.json not found for ${projectDir}`);
      }
    }
  } catch (error) {
    console.error('❌ Error loading projects:', error);
  }

  console.log('\n=== Project Load Summary ===');
  console.log(`📊 Total projects loaded: ${projects.length}`);
  console.log('Projects:', projects.map(p => ({
    id: p.id,
    title: p.title,
    imageCount: p.images.length
  })));
  return projects;
} 