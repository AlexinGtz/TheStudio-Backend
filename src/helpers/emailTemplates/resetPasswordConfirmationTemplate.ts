type resetPasswordConfirmationOptions = {
    email: string;
    newPassword: string;
}

export default (opt: resetPasswordConfirmationOptions) => ({
    from: '"The Studio" <contacto@thestudioapp.com>',
    to: opt.email,
    subject: "Contraseña restaurada",
    text: 'Tu contraseña ha cambiado exitosamente. Ingresa a la aplicación con tu número telefónico y la siguiente contraseña: ' + opt.newPassword + '. No se te olvide cambiarla por una que conozcas',
    html: `
        <div>
            <h1>Restaurar contraseña</h1>

            <p>Tu contraseña ha sido cambiada con éxito.</p>
            <p>Ingresa a la aplicación con tu número telefónico y la siguiente contraseña.</p>
            <p>No se te olvide cambiarla por una que conozcas</p>
            <br />
            <p>Nueva contraseña <b>${opt.newPassword}</b></p>
            <br />
            <br />
            <p style="font-size: smaller;">No contestar este correo, fue enviado de manera automatica</p>
            <p style="font-size: smaller;">Si ya no quieres recibir correos haz click <a href="https://sgct180v33.execute-api.us-east-2.amazonaws.com/qa/ignoreMail?email=${opt.email}">aqui</a></p>
        </div>
    `
}) 