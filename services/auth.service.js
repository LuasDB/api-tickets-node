import { db } from './../db/mongoClient.js'
import nodemailer from 'nodemailer'
import path from 'path'
import Boom from '@hapi/boom'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import config from '../config.js'
import { restablecerPass } from '../templates/restablecerPass.js'
import {sendMail} from '../utils/sendMail.js'

class Auth{
  constructor(){
    this.jwtSecret = config.jwtSecret,
    this.jwtExpiration = '1h',
    this.mailTransporter = nodemailer.createTransport({
      service:'gmail',
      auth:{
        user:config.emailSupport,
        pass:config.passSupport
      }
    })
  }

  async create(data){

    try {
      const { name, email, company,role} = data
      if(!name || !email ){
        throw Boom.badData('Todos los datos son necesarios')
      }

      const user = await db.collection('users').findOne({email:email})

      if(user){
        throw Boom.conflict(`El usuario con correo ${email} ya existe`);
      }

      console.log('Estamos entrando')
      const result = await db.collection('users').insertOne({
        name, email,company,
        role,
        password:null,
        serviceTime:{
          total:0,
          used:0,
          remaining:0,
          tickets:0,
          activeTickets:0,
          history:[]
        }
      })


      if(result.insertedId){
        const resetToken = jwt.sign(
          { userId: result.insertedId,email },
          this.jwtSecret,
          { expiresIn: '1h' }
        );

        const resetLink = `${config.urlApp}/reset-password?token=${resetToken}`

        sendMail({
          to:email,
          subject:'Creación de contraseña',
          data:{name,company,resetLink},
          templateEmail:'register',
          attachments:[{
            filename:'logo_omegasys',
            path:path.join('emails/logo_omegasys.png'),
            cid:'logo_omegasys'
          }]
        })
      }

      return {id:result.insertedId,email}
    } catch (error) {
      if(Boom.isBoom(error)){
        throw error
      }
      throw Boom.badImplementation('Error al registrar usuario',error)

    }

  }

  async login(data){
    try {
      const { password,email } = data
      const user = await db.collection('users').findOne({email})

      if(!user){
        throw Boom.unauthorized('Email o passwor incorrectos')
      }

      const isPasswordValid = await bcrypt.compare(password,user.password)


      if(!isPasswordValid){
        throw Boom.unauthorized('Email o passwor incorrectos')
      }

      const payload = { userId:user._id, email:user.email, nombre:user.name, role:user.role,serviceTime:user.serviceTime,company:user.company}
      const token = jwt.sign(payload,this.jwtSecret,{ expiresIn:this.jwtExpiration})

      return token

    } catch (error) {
      if(Boom.isBoom(error)){
        throw error
      }
      throw Boom.badImplementation('Error al registrar usuario',error)
    }
  }

  async forgotPassword(data){
    try {
      const { email } = data
      const user = await this.getUserByEmail(email)

      const resetToken = jwt.sign(
        { userId: user._id,email:user.email },
        this.jwtSecret,
        { expiresIn: '15min' }
      );

      const resetLink = `${config.urlApp}/reset-password?token=${resetToken}`

      sendMail({
        to:user.email,
        subject:'Restablecimiento de contraseña',
        data:{name:user.name,resetLink},
        templateEmail:'restartPassword',
        attachments:[{
          filename:'logo_omegasys',
          path:path.join('emails/logo_omegasys.png'),
          cid:'logo_omegasys'
        }]
      })
      return 'Se envío correo'

    } catch (error) {
      if(Boom.isBoom(error)){
        throw error
      }
      throw Boom.badImplementation('Error al registrar usuario',error)
    }
  }

  async getUserByEmail(email){
    try {
      const user = await db.collection('users').findOne({email:email})
      if (!user) {
        throw Boom.notFound('No se encontró un usuario con ese correo');
      }

      return user

    } catch (error) {
      if(Boom.isBoom(error)){
        throw error
      }
      throw Boom.badImplementation('Error al registrar usuario',error)
    }
  }

  async resetPassword(token, newPassword){
    try {
      const decoded = jwt.verify(token,this.jwtSecret)
      const user =await this.getUserByEmail(decoded.email)
      const hashedPassword = await bcrypt.hash(newPassword,10)

      const result = await db.collection('users').updateOne(
        {_id:user._id},
        {$set:{password:hashedPassword}}
      )

      return { message:'Contraseña actualizada' }
    } catch (error) {
      if(Boom.isBoom(error)){
        throw error
      }
      throw Boom.badImplementation('Error al registrar usuario',error)
    }
  }

  async oto(data){
    try {

    } catch (error) {
      if(Boom.isBoom(error)){
        throw error
      }
      throw Boom.badImplementation('Error al registrar usuario',error)
    }
  }

}

export default Auth
