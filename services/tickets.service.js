import Boom from "@hapi/boom"
import { db } from '../db/mongoClient.js'
import { ObjectId } from "mongodb"

export default class Tickets{
  constuctor(){

  }
  async create(newData){
    try {
      const messages=[]
      messages.push(newData.firstMessage)
      delete newData.firstMessage
      const data={...newData,messages,userId:newData.user.userId}

      const resultNew = await db.collection('tickets').insertOne(data)

      const updateUser=await db.collection('users').updateOne(
        { _id:new ObjectId(newData.user.userId)},
        { $inc:{
                'serviceTime.tickets':1,
                'serviceTime.activeTickets':1,

              }
        }
      )
      console.log(updateUser)

      return {...data,_id:resultNew.insertedId}
    } catch (error) {
      if(Boom.isBoom(error)){
        throw error
      }else{
        throw Boom.badImplementation('Algo hizo falta para crear el registro',error)
      }
    }
  }

  async getActiveTickets(){
    try {

      const result = await db.collection('tickets').find({
        status:'open'
      }).toArray()

      return result

    } catch (error) {
      if(Boom.isBoom(error)){
        throw error
      }else{
        throw Boom.serverUnavailable('No se puede realizar la consulta')
      }
    }
  }

  async getRequests(){
    try {
      const result = await db.collection('requestHours').find({
        status:'open'
      }).toArray()

      return result
    } catch (error) {
      if(Boom.isBoom(error)){
        throw error
      }else{
        throw Boom.serverUnavailable('No se puede descargar informacion por ahora')
      }
    }
  }

  async getAllByUser(id){
    try {
      console.log(id)
      if(!ObjectId.isValid(id)){
        throw Boom.badRequest('El proporcionado ID no es valido')
      }
      const tickets = await db.collection('tickets').find({
       userId:id
      }).toArray()

      return tickets
    } catch (error) {
      if(Boom.isBoom(error)){
        throw error
      }else{
        throw Boom.notFound('Algo salio mal , no se puede servir la info',error)
      }
    }
  }

  async getClients(){
    try {
      const clients = await db.collection('users').find(
        {role:'client'}
      ).toArray()

      return clients
    } catch (error) {
      if(Boom.isBoom(error)){
        throw error
      }else{
        throw Boom.serverUnavailable('No se puede descargar informacion por ahora')
      }
    }
  }

  async addMessage(id,newMessage){
    try {
      const result = await db.collection('tickets').updateOne(
        {_id:new ObjectId(id)},
        { $push:{messages:newMessage}}
      )
      return {newMessage,ticketId:id}
    } catch (error) {
      if(Boom.isBoom(error)){
        throw error
      }else{
        throw Boom.badImplementation('Mensaje no agregado, algo esta mal',error)
      }
    }


  }

  async serviceHoursPurchases(data){
    try {
      const result = await db.collection('requestHours').insertOne(data)
      return { result }
    } catch (error) {
      if(Boom.isBoom(error)){
        throw error
      }else{
        throw Boom.serverUnavailable('No se puede completar la petición, intentalo mas tarde')
      }
    }
  }
  async addHours(data){
    try {
      console.log('Solcitud de horas',data)
      const userId = data.request.user.userId
      const requetsId = data.request._id


      const result = await db.collection('users').updateOne(
        {_id:new ObjectId(userId)},
        {
          $inc:{
          'serviceTime.total':data.hours,
          'serviceTime.remaining':data.hours
          },
          $push:{
          'serviceTime.history':data.request
          }
        }
      )

      if(result.modifiedCount === 1){
        await db.collection('requestHours').updateOne(
          {_id: new ObjectId(requetsId)},{$set:{
            ...data,status:'close'
          }}
        )
      }




     return data
    } catch (error) {
      if(Boom.isBoom(error)){
        throw error
      }else{
        throw Boom.serverUnavailable('No se puede completar la petición, intentalo mas tarde')
      }
    }
  }

  async finishedTicket(data){
    console.log('lo que llega:')
    console.log(data)
    const { ticketId,userId,consumedHours,resume,finishedAt } = data
    try {

      const updateTicket = await db.collection('tickets').updateOne(
        {_id: new ObjectId(ticketId)},
        {$set:{
          status:'close',consumedHours,resume,finishedAt
        }}
      )

      const updateUser = await db.collection('users').updateOne(
        {_id: new ObjectId(userId)},
        {$inc:{
          'serviceTime.activeTickets':-1,
          'serviceTime.used':consumedHours,
          'serviceTime.remaining':-consumedHours,
          'serviceTime.resolvedTickets':1
        }}
      )
      return {status:'close',consumedHours,resume,finishedAt,ticketId }
    } catch (error) {
      if(Boom.isBoom(error)){
        throw error
      }else{
        throw Boom.serverUnavailable('No se puede completar la petición, intentalo mas tarde')
      }
    }





  }
}
