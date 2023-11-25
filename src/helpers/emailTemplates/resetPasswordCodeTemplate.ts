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
    <div style="background-color: #F5F5F5; width: 500px; display: flex; align-items: center; flex-direction: column;">
        <h1 style="color: #CBB6A2; display: inline;">The Studio</h1>
        <p style="font-size: large; width: 70%; margin: 0.5rem 0;">Tu codigo de verificacion es:</p>
        <p style="font-size: large; width: 70%; margin: 2rem 0;"><b>${opt.code}</b></p>
        <p style="font-size: large; width: 70%; margin: 0.5rem 0;">Ingrésalo en la página web para restaurar tu contraseña</p>
        <p style="font-size: smaller; width: 70%; margin: 0.5rem 0;">Éste código será válido sólo por 1 hora</p>
        <br />
        <p style="font-size: x-small; margin: 0;">No contestar este correo, fue enviado de manera automatica</p>
        <p style="font-size: x-small; margin: 0;">Si ya no quieres recibir correos electrónicos haz click <a href="https://${process.env.STAGE}-api.thestudioapp.com/ignoreMail?email=${opt.email}" target="_blank">aqui</a></p>
    </div>
    `
}) 