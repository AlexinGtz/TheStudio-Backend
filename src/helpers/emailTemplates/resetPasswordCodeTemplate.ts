type resetPasswordCodeOptions = {
    code: string;
    email: string;
}

export default (opt: resetPasswordCodeOptions) => ({
    from: '"The Studio" <j.alex1410@hotmail.com>',
    to: opt.email,
    subject: "Código de verificación",
    text: 'Tu código de verificación es: ' + opt.code,
    html: `
        <div>
            <h1>The Studio</h1>

            <p>Tu codigo de verificacion es:</p>
            <p><b>${opt.code}</b></p>
            <p>Ingrésalo en la página web para restaurar tu contraseña</p>
            <br />
            <p>Éste código será válido sólo por 1 hora</p>
            <br />
            <br />
            <p style="font-size: smaller;">No contestar este correo, fue enviado de manera automatica</p>
            <p style="font-size: smaller;">Si ya no quieres recibir correos haz click <a href="https://sgct180v33.execute-api.us-east-2.amazonaws.com/qa/ignoreMail?email=${opt.email}">aqui</a></p>
        </div>
    `
}) 