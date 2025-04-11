import nodemailer from 'nodemailer'
import Boom from '@hapi/boom'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import config from '../config.js'

const sendMail = async ({
    to,subject,html
})=>{
    const transporter = nodemailer.createTransport({
        service:config.serviceEmailSupport,
        auth:{
            user:config.emailSupport,
            pass:config.passSupport
        }
    })

    await transporter.sendMail({
        from:`"Soporte Técnico" <${config.emailSupport}>`,
        to,subject,html
    })
}

export { sendMail }
