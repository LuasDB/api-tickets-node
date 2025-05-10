import express from 'express'
import collectionsRouter from './collections.router.js'
import ticketsRouter from './tickets.router.js'
import authRouter from './auth.router.js'
const router = express.Router()

const AppRouter = (app,io) => {

  app.use('/api/v1', router)
  router.use('/collections', collectionsRouter(io))
  router.use('/auth', authRouter)
  router.use('/tickets',ticketsRouter(io))
  //Agregar las rutas necesarias


}

export default AppRouter
