import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const QUALITY = 90; // High quality setting
const SIZES = {
  main: { width: 1920, height: 1080 },
  detail: { width: 1600, height: 1200 }
};

async function optimizeImage(inputPath: string, outputPath: string, isMain: boolean) {
  const size = isMain ? SIZES.main : SIZES.detail;
  
  try {
    await sharp(inputPath)
      .resize(size.width, size.height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({
        quality: QUALITY,
        progressive: true,
        chromaSubsampling: '4:4:4' // High quality color sampling
      })
      .toFile(outputPath);
    
    console.log(`Optimized: ${outputPath}`);
  } catch (error) {
    console.error(`Error processing ${inputPath}:`, error);
  }
}

async function processDirectory(dirPath: string) {
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const inputPath = path.join(dirPath, file);
    const stats = fs.statSync(inputPath);
    
    if (stats.isDirectory()) {
      await processDirectory(inputPath);
    } else if (file.match(/\.(jpg|jpeg|png)$/i)) {
      const isMain = file.startsWith('main');
      const outputPath = inputPath.replace(/\.(jpg|jpeg|png)$/i, '.jpg');
      await optimizeImage(inputPath, outputPath, isMain);
    }
  }
}

// Process all images in the projects directory
const projectsDir = path.join(process.cwd(), 'public', 'images', 'projects');
processDirectory(projectsDir)
  .then(() => console.log('Image optimization complete'))
  .catch(console.error); 