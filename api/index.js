import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const filePath = path.join(process.cwd(), 'index.html');
  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(fileContent);
}
