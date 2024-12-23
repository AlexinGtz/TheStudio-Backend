import { HTTP_ERROR_CODES } from "../constants";
import { CustomDynamoDB } from "../dynamodb/database";
import { responseHelper } from "../helpers/responseHelper";
import { validateToken } from "../helpers/validateToken";

const classesDB = new CustomDynamoDB(process.env.CLASSES_TABLE!, 'month', 'date_by_type');

export const handler = async (event: any) => {
    const tokenData = await validateToken(event.headers.Authorization);
    if(!tokenData) {
        return responseHelper("Token de usuario no válido", undefined, HTTP_ERROR_CODES.BAD_REQUEST);
    }

    const { classDateByType, classMonth } = event.queryStringParameters;

    if(!classDateByType || !classMonth) {
        return responseHelper("Falta el mes o el tipo de clase en la llamada", undefined, HTTP_ERROR_CODES.NOT_FOUND);
    }

    const classInfo = await classesDB.getItem(classMonth, classDateByType);

    if(!classInfo || classInfo.cancelled) {
        return responseHelper("Información de la clase no encontrada", undefined, HTTP_ERROR_CODES.NOT_FOUND);
    }

    return responseHelper('Success', classInfo);
}