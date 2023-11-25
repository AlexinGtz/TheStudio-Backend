type registerTemplateOptions = {
    email: string;
}

export default (opt: registerTemplateOptions) => ({
    from: '"The Studio" <j.alex1410@hotmail.com>',
    to: opt.email,
    subject: "Registro exitoso",
    text: 'Bienvenido a The Studio',
    html: `
    <div style="background-color: #F5F5F5; width: 500px; display: flex; align-items: center; flex-direction: column;">
        <h1>Bienvenido a <p style="color: #CBB6A2; display: inline;">The Studio</p></h1>
        <p style="font-size: large; width: 70%; margin: 0.5rem 0;">Tu perfil ha sido creado. Esperemos disfrutes del pilates en <b><i>The Studio</i></b></p>
        <p style="font-size: large; width: 70%; margin: 0.5rem 0;">Usa la <a href="https://${process.env.STAGE !== 'prod' ? 'qa.' : ''}thestudioapp.com" target="_blank"><b>aplicación</b></a> para reservar tu primera clase. <b>¡Te esperamos!</b></p>
        <p style="font-size: large; width: 70%; margin: 0.5rem 0;">Inicia sesión con tu número telefónico y la contraseña con la que te registraste</p>
        <br />
        <p style="font-size: smaller; margin: 0;">No contestar este correo, fue enviado de manera automatica</p>
        <p style="font-size: smaller; margin: 0;">Si ya no quieres recibir correos haz click <a href="https://${process.env.STAGE}-api.thestudioapp.com/ignoreMail?email=${opt.email}" target="_blank">aqui</a></p>
    </div>
    `
}) 