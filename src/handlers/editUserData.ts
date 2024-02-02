import { HTTP_ERROR_CODES } from "../constants";
import { CustomDynamoDB } from "../dynamodb/database";
import { responseHelper } from "../helpers/responseHelper";
import { validateToken } from "../helpers/validateToken";

const usersDB = new CustomDynamoDB(process.env.USERS_TABLE!, 'phoneNumber');

export const handler = async (event: any) => {
    const tokenData = await validateToken(event.headers.Authorization);
    if(!tokenData) {
        return responseHelper("Token de usuario no válido", undefined, HTTP_ERROR_CODES.BAD_REQUEST);
    }

    const { firstName, lastName } = JSON.parse(event.body);

    const userData = await usersDB.getItem(tokenData.phoneNumber);
    
    if(!userData) {
        return responseHelper("Datos del usuario no encontrados", undefined, HTTP_ERROR_CODES.NOT_FOUND)
    }

    userData.firstName = firstName ?? userData.firstName;
    userData.lastName = lastName ?? userData.lastName;


    try {
        await usersDB.updateItem(userData.phoneNumber, {
            firstName: userData.firstName,
            lastName: userData.lastName,
        });
    } catch (error) {
        return responseHelper("Error actualizando la información", undefined, HTTP_ERROR_CODES.INTERNAL_SERVER_ERROR);
    }


    return responseHelper("Datos actualizados correctamente");
}