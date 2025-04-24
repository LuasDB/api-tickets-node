import nodemailer from 'nodemailer'
import hbs from 'nodemailer-express-handlebars'
import path, { extname } from 'path'
import Boom from '@hapi/boom'
import config from '../config.js'

const sendMail = async ({
    to,subject,data,templateEmail,attachments=[]
})=>{

    const transporter = nodemailer.createTransport({
        service:config.serviceEmailSupport,
        auth:{
            user:config.emailSupport,
            pass:config.passSupport
        }
    })

    transporter.use(
      'compile',
      hbs({
        viewEngine:{
          extname:'.hbs',
          partialsDir:path.resolve('./emails'),
          defaultLayout:false
        },
        viewPath:path.resolve('./emails'),
        extName:'.hbs'
      })
    )

    try {
      await transporter.sendMail({
        from:`"Soporte Técnico" <${config.emailSupport}>`,
        to,
        subject,
        template:templateEmail,
        context:data,
        attachments
    })
    } catch (error) {
      console.log(error)
    }


}

export { sendMail }
