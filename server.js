import express from 'express'
import cors from 'cors' // Import the cors middleware
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 8353

// Enable CORS for all routes
app.use(cors())

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, 'public')))

// Endpoint to list all image files in the directory
app.get('/api/images', (req, res) => {
  console.log('Received request for /api/images')
  const imagesDir = path.join(__dirname, 'public/LFW/lfw_funneled')
  fs.readdir(imagesDir, { withFileTypes: true }, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err)
      return res.status(500).json({ error: 'Failed to read directory' })
    }

    const imagePaths = []
    files.forEach(file => {
      if (file.isDirectory()) {
        const subDir = path.join(imagesDir, file.name)
        const subFiles = fs.readdirSync(subDir)
        subFiles.forEach(subFile => {
          if (/\.(jpg|jpeg|png|gif)$/i.test(subFile)) {
            imagePaths.push(`/LFW/lfw_funneled/${file.name}/${subFile}`)
          }
        })
      }
    })

    console.log('Returning image paths:', imagePaths)
    res.json(imagePaths)
  })
})

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
