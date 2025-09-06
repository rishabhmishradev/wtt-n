import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const filePath = path.join(process.cwd(), 'css', 'styles.css');
  
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    res.setHeader('Content-Type', 'text/css');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(200).send(fileContent);
  } catch (error) {
    res.status(404).send('CSS file not found');
  }
}
