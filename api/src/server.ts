import express from 'express'
import cors from 'cors'
import { config } from './config'
import { errorHandler, notFoundHandler } from './middleware/error-handler'

const app = express()

app.use(cors({ origin: config.corsOrigin.split(',') }))
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use(notFoundHandler)
app.use(errorHandler)

app.listen(config.port, () => {
  console.log(`API escuchando en http://localhost:${config.port}`)
})