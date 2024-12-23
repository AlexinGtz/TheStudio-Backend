import { HTTP_ERROR_CODES, USER_TYPES } from "../constants";
import { CustomDynamoDB } from "../dynamodb/database";
import { validateToken } from "../helpers/validateToken";
import { responseHelper } from "../helpers/responseHelper";

const classesDB = new CustomDynamoDB(process.env.CLASSES_TABLE!, 'month', 'date_by_type');
const usersDB = new CustomDynamoDB(process.env.USERS_TABLE!, 'phoneNumber');

export const handler = async (event: any) => {
    const tokenData = await validateToken(event.headers.Authorization);
    if(!tokenData) {
        return responseHelper("Token de usuario no válido", undefined, HTTP_ERROR_CODES.BAD_REQUEST);
    }

    const userInfo = await usersDB.getItem(tokenData.phoneNumber);

    if(!userInfo) {
        return responseHelper("Datos del usuario no encontrados", undefined, HTTP_ERROR_CODES.NOT_FOUND);
    }

    const { type } = event.queryStringParameters;
    if(!type) {
        return responseHelper("Falta el tipo de clase en la llamada", undefined, HTTP_ERROR_CODES.NOT_FOUND);
    }
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const classes = (await Promise.all([
        classesDB.query((today.getMonth() + 1).toString()),
        classesDB.query((nextMonth.getMonth() + 1).toString())
    ])).flat();

    const filteredClasses = classes.filter((c) => !c.cancelled && c.date_by_type.split('#')[1] === type && new Date(c.date_by_type.split('#')[0]) > today && new Date(c.date_by_type.split('#')[0]) < nextMonth);

    return responseHelper('Success', {classes: filteredClasses})
}