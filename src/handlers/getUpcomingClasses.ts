import { HTTP_ERROR_CODES, USER_TYPES } from "../constants";
import { CustomDynamoDB } from "../dynamodb/database";
import { validateToken } from "../helpers/validateToken";
import { responseHelper } from "../helpers/responseHelper";

const classesDB = new CustomDynamoDB(process.env.CLASSES_TABLE!, 'month', 'date');
const usersDB = new CustomDynamoDB(process.env.USERS_TABLE!, 'phoneNumber');

export const handler = async (event: any) => {
    const tokenData = await validateToken(event.headers.Authorization);
    if(!tokenData) {
        return responseHelper("Token de usuario no váildo", undefined, HTTP_ERROR_CODES.BAD_REQUEST);
    }

    const userInfo = await usersDB.getItem(tokenData.phoneNumber);

    if(!userInfo) {
        return responseHelper("Datos del usuario no encontrados", undefined, HTTP_ERROR_CODES.NOT_FOUND);
    }

    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const classes = (await Promise.all([
        await classesDB.query((today.getMonth() + 1).toString(), today.toISOString(), '>'),
        await classesDB.query((today.getMonth() + 2).toString(), nextMonth.toISOString(), '<')
    ])).flat();

    const filteredClasses = classes.filter((c) => !c.cancelled);

    return responseHelper('Success', {classes: filteredClasses})
}