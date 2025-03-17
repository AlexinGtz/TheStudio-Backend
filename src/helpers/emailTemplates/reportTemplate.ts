type registerTemplateOptions = {
    totalsIndividualRows: string;
    totalsRow: string;
    userRows: string;
    userTotalsRows: string;
    dateRange: {
        startDay: string;
        startMonth: string;
        endDay: string;
        endMonth: string;
        year: string;
    }
}

export default (opt: registerTemplateOptions) => ({
    from: '"The Studio" <marianassilvar18@gmail.com>',
    to: 'j.alex1410@hotmail.com',//'marianassilvar18@gmail.com',
    bcc: 'j.alex1410@hotmail.com',
    subject: 'Reporte de ventas de Move',
    text: 'Reporte de ventas de Move',
    html: `
     <div style='background-color: #F5F5F5; width: 800px; display: flex; align-items: center; flex-direction: column; margin: 20px;'>
            <h1>Reporte de ventas de <p style='color: #CBB6A2; display: inline;'>Move</p></h1>
            <h2>Del ${opt.dateRange.startDay} de ${opt.dateRange.startMonth} al ${opt.dateRange.endDay} de ${opt.dateRange.endMonth} del ${opt.dateRange.year}</h2>
            <br/>
            <h3>Totales</h3>
            <table style='width: 80%; border-collapse: collapse; border: 1px solid #000; border-radius: 5px;'>
                <tr style='background-color: #CBB6A2;'>
                    <th>Paquete</th>
                    <th>Clases</th>
                    <th>Precio</th>
                    <th>Ventas</th>
                    <th>Ingresos</th>
                </tr>
                ${opt.totalsIndividualRows}
                ${opt.totalsRow}
                </tr>
            </table>
    <br/>
            <h3>Por Usuario</h3>
            <table style='width: 80%; border-collapse: collapse; border: 1px solid #000; border-radius: 5px;'>
                <tr style='background-color: #CBB6A2;'>
                    <th>Usuario</th>
                    <th>Paquete</th>
                    <th>Fecha</th>
                    <th>Precio</th>
                </tr>
                ${opt.userRows}
                ${opt.userTotalsRows}
            </table>
        </div>
    `
}) 