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
    
    if(tokenData.userType !== 'admin') {
        return responseHelper("Accion no permitida", undefined, HTTP_ERROR_CODES.UNAUTHORIZED);
    }

    const { userPhoneNumber } = event.pathParameters;
    
    try {
        await usersDB.updateItem(userPhoneNumber, {
            deleted: true
        });
    } catch (error) {
        return responseHelper("Error actualizando la información", undefined, HTTP_ERROR_CODES.INTERNAL_SERVER_ERROR);
    }

    return responseHelper("Usuario eliminado exitosamente");
}