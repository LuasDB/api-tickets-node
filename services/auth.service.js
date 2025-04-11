import { db } from './../db/mongoClient.js'
import nodemailer from 'nodemailer'
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
      const { name, email } = data
      if(!name || !email ){
        throw Boom.badData('Todos los datos son necesarios')
      }

      const user = await db.collection('users').findOne({email:email})

      if(user){
        throw Boom.conflict(`El usuario con correo ${email} ya existe`);
      }


      const result = await db.collection('users').insertOne({
        name, email,
        role:'client',
        password:null,
        serviceTime:{
          total:0,
          used:0,
          remaining:0,
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
          html:`
          <h2>Hola ${name}</h2>
        <p>Bienvenido al sistema de soporte técnico.</p>
        <p>Haz clic en el siguiente botón para establecer tu contraseña:</p>
        <a href="${resetLink}" style="padding: 10px 20px; background: #0d6efd; color: white; text-decoration: none; border-radius: 5px;">Restablecer contraseña</a>
        <p>Este enlace expirará en 1 hora.</p>
      `

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

      const payload = { userId:user._id, email:user.email, nombre:user.name}
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
        { expiresIn: '1min' }
      );

      const resetLink = `${config.urlApp}/reset-password?token=${resetToken}`

      const mailOptions = {
        from:config.emailSupport,
        to:email,
        subject:'Restablecer contraseña',
        html:restablecerPass(resetLink,config.server)
      }


      await this.mailTransporter.sendMail(mailOptions,(error,info)=>{
        console.log('enviando correo...')

        if(error){
          console.error('Error al enviar el correo ',error)

        }else{
          console.log('Correo enviado:', info.response)
        }
      })

      return 'Se ha enviado un enlace de restablecimiento de contraseña a tu correo.'


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

      const user = this.getUserByEmail(decoded.email)

      const hashedPassword = await bcrypt.hash(newPassword,10)

      await db.collection('users').updateOne(
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
