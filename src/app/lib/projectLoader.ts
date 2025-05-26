import fs from 'fs/promises';
import path from 'path';
import { logger } from '@/lib/logger';
import { Project } from '@/lib/models/Project';
import type { ProjectDocument } from '@/lib/validators/project';

const PROJECTS_DIR = 'projects';
const POSSIBLE_PATHS = [
  path.join(process.cwd(), PROJECTS_DIR),
  path.join(process.cwd(), 'src', PROJECTS_DIR),
  path.join(process.cwd(), '..', PROJECTS_DIR),
  path.join(process.cwd(), '..', '..', PROJECTS_DIR)
];

export async function loadProjects(): Promise<ProjectDocument[]> {
  try {
    logger.info('[ProjectLoader] Starting project load', {
      action: 'load_projects',
      cwd: process.cwd()
    });

    // Find projects directory
    let projectsDir: string | null = null;
    for (const dirPath of POSSIBLE_PATHS) {
      try {
        logger.debug('[ProjectLoader] Checking directory', {
          action: 'find_projects_dir',
          path: dirPath
        });

        await fs.access(dirPath);
        projectsDir = dirPath;
        logger.info('[ProjectLoader] Found projects directory', {
          action: 'find_projects_dir',
          path: dirPath
        });
        break;
      } catch {
        // Directory not found, continue to next path
        continue;
      }
    }

    if (!projectsDir) {
      logger.error('[ProjectLoader] Projects directory not found', {
        action: 'find_projects_dir',
        searchedPaths: POSSIBLE_PATHS
      });
      throw new Error('Projects directory not found');
    }

    // Get all project directories
    const projectDirs = await fs.readdir(projectsDir);
    logger.info('[ProjectLoader] Found project directories', {
      action: 'list_projects',
      count: projectDirs.length,
      directories: projectDirs
    });

    // Load each project
    const projects: ProjectDocument[] = [];
    for (const projectDir of projectDirs) {
      try {
        const projectPath = path.join(projectsDir, projectDir);
        const projectJsonPath = path.join(projectPath, 'project.json');

        logger.debug('[ProjectLoader] Processing project', {
          action: 'load_project',
          projectDir,
          projectJsonPath
        });

        // Read project.json
        const projectData = JSON.parse(
          await fs.readFile(projectJsonPath, 'utf-8')
        );

        logger.debug('[ProjectLoader] Found project.json', {
          action: 'load_project',
          projectDir,
          title: projectData.title
        });

        // Get all images in the project directory
        const files = await fs.readdir(projectPath);
        const images = files.filter(file => 
          /\.(jpg|jpeg|png|webp)$/i.test(file)
        );

        logger.debug('[ProjectLoader] Found project images', {
          action: 'load_project',
          projectDir,
          imageCount: images.length
        });

        // Find main image
        const mainImage = images.find(img => 
          img.toLowerCase().includes('main') || 
          img.toLowerCase().includes('cover')
        ) || images[0];

        if (mainImage) {
          logger.debug('[ProjectLoader] Found main image', {
            action: 'load_project',
            projectDir,
            mainImage
          });
        }

        // Create project object
        const project = await Project.create({
          title: projectData.title,
          summary: projectData.summary || '',
          description: projectData.description || '',
          mainImage: {
            url: `/images/${projectDir}/${mainImage}`,
            alt: projectData.title,
            description: projectData.summary || '',
            data: await fs.readFile(path.join(projectPath, mainImage)),
            contentType: `image/${path.extname(mainImage).slice(1)}`
          },
          images: await Promise.all(images
            .filter(img => img !== mainImage)
            .map(async img => ({
              url: `/images/${projectDir}/${img}`,
              alt: `${projectData.title} - ${img}`,
              description: projectData.summary || '',
              data: await fs.readFile(path.join(projectPath, img)),
              contentType: `image/${path.extname(img).slice(1)}`
            }))),
          mainImageIndex: 0
        });

        projects.push(project);
        logger.info('[ProjectLoader] Successfully loaded project', {
          action: 'load_project',
          projectDir,
          title: project.title,
          imageCount: project.images.length + 1 // +1 for main image
        });
      } catch (error) {
        if (error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
          logger.warn('[ProjectLoader] Project JSON not found', {
            action: 'load_project',
            projectDir,
            error: error.message
          });
        } else {
          logger.error('[ProjectLoader] Error loading project', {
            action: 'load_project',
            projectDir,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
          });
        }
      }
    }

    logger.info('[ProjectLoader] Project load complete', {
      action: 'load_projects',
      totalProjects: projects.length,
      projects: projects.map(p => ({
        title: p.title,
        imageCount: p.images.length + 1 // +1 for main image
      }))
    });

    return projects;
  } catch (error) {
    logger.error('[ProjectLoader] Error loading projects', {
      action: 'load_projects',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
} 