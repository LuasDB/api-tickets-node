import express from 'express'
import { Boom } from '@hapi/boom'
import Tickets from '../services/tickets.service.js'

const router = express.Router()
const tickets = new Tickets()

const ticketsRouter = (io)=>{

  router.get('/',async(req,res,next)=>{
    try {
      const getActiveTickets = await tickets.getActiveTickets()
      res.status(200).json({
        success:true,
        data:getActiveTickets
      })
    } catch (error) {
     next(error)
    }
  })

  router.get('/:idUser',async(req,res,next)=>{
    try {
      const { idUser } = req.params
      const allTickets = await tickets.getAllByUser(idUser)
      res.status(200).json({
        success:true,
        data:allTickets
      })
    } catch (error) {
      next(error)
    }
  })

  router.get('/requests/getall',async(req,res,next)=>{
    try {
      const getRequests = await tickets.getRequests()

      res.status(200).json({
        success:true,
        data:getRequests
      })
    } catch (error) {
      next(error)
    }
  })


  router.post('/',async(req,res,next)=>{
    try {
      const { body } = req
      console.log(body)
      const newTicket = await tickets.create(body)

      io.emit('new_ticket',newTicket)

      res.status(201).json({
        success:true,
        message:'Creado',data:newTicket
      })
    } catch (error) {
      next(error)
    }
  })

  router.post('/service-hours-purchases',async(req,res,next)=>{
    try {
      const tickets = new Tickets()
      const newReq = await tickets.serviceHoursPurchases(req.body)


      res.status(200).json({
        success:true,
        message:'Solicitud enviada',
        data:newReq
      })
    } catch (error) {
      next(error)
    }
  })
  router.post('/add-hours',async(req,res,next)=>{
    try {

      const newReq = await tickets.addHours(req.body)

      io.emit('update_plan',newReq)


      res.status(200).json({
        success:true,
        message:'Solicitud enviada',
        data:newReq
      })
    } catch (error) {
      next(error)
    }
  })
  router.patch('/add-message/:id',async(req,res,next)=>{
    try {
      const { id } = req.params
      const { body } = req

      const newMessage = await tickets.addMessage(id,body)
      io.emit('new_message',newMessage)

      res.status(201).json({
        success:true,
        message:'Actualizado',
        data:newMessage
      })
    } catch (error) {
      next(error)
    }
  })


  return router
}



export default ticketsRouter
