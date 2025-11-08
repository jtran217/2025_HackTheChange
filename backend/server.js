// server.js
import express from 'express'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.get('/', (req, res) => {
  res.json({ message: '🚀 Hello from your Express backend!' })
})

app.post('/echo', (req, res) => {
  const { data } = req.body
  res.json({ echo: data })
})

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`)
})
