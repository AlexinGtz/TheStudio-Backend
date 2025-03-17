export default () => ({
    from: '"The Studio" <marianassilvar18@gmail.com>',
    to: 'j.alex1410@hotmail.com',//'marianassilvar18@gmail.com',
    bcc: 'j.alex1410@hotmail.com',
    subject: 'Reporte de ventas de Move',
    text: 'Reporte de ventas de Move',
    html: `
        <div style='background-color: #F5F5F5; width: 800px; display: flex; align-items: center; flex-direction: column;'>
            <h1>Reporte de ventas de <p style='color: #CBB6A2; display: inline;'>Move</p></h1>
            <h2>No se encontraron compras en el periodo seleccionado</h2>
        </div>
    `
}) 