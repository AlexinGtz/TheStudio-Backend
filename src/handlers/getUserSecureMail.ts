import { HTTP_ERROR_CODES } from "../constants";
import { CustomDynamoDB } from "../dynamodb/database";
import { responseHelper } from "../helpers/responseHelper";

const usersDB = new CustomDynamoDB(process.env.USERS_TABLE!, 'phoneNumber');

export const handler = async (event: any) => {
    const { userPhoneNumber } = event.queryStringParameters;

    if(!userPhoneNumber) {
        return responseHelper("No hay número telefónico", undefined, HTTP_ERROR_CODES.BAD_REQUEST);
    }

    const userData = await usersDB.getItem(userPhoneNumber);

    if(!userData) {
        return responseHelper("Datos del usuario no encontrados", undefined, HTTP_ERROR_CODES.NOT_FOUND)
    }

    const asterisks = '*'.repeat(userData.email.length - 9);

    const secureMail = userData.email.slice(0,2) + asterisks + userData.email.slice(-7); 

    return responseHelper("Success", {
        secureMail
    });
}