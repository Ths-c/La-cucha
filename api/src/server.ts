import { createApp } from './app'
import { config } from './config'

const app = createApp()

app.listen(config.port, () => {
  console.log(`API escuchando en http://localhost:${config.port}`)
})