type registerTemplateOptions = {
    email: string;
}

export default (opt: registerTemplateOptions) => ({
    from: '"The Studio" <j.alex1410@hotmail.com>',
    to: opt.email,
    subject: "Registro exitoso",
    text: 'Bienvenido a The Studio',
    html: `
        <div>
            <h1>Bienvenido a The Studio</h1>

            <p>Tu perfil ha sido creado. Esperemos disfrutes de las clases en The Studio</p>
            <p>Usa la app para reservar tu primera clase. ¡Te esperamos!</p>

            <br />
            <br />

            <p style="font-size: smaller;">No contestar este correo, fue enviado de manera automatica</p>
            <p style="font-size: smaller;">Si ya no quieres recibir correos haz click <a href="https://sgct180v33.execute-api.us-east-2.amazonaws.com/qa/ignoreMail?email=${opt.email}">aqui</a></p>
        </div>
    `
}) 