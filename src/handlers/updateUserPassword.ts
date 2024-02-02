import { compare, hash } from "bcryptjs";
import { HTTP_ERROR_CODES } from "../constants";
import { CustomDynamoDB } from "../dynamodb/database";
import { responseHelper } from "../helpers/responseHelper";
import { validateToken } from "../helpers/validateToken";

const usersDB = new CustomDynamoDB(process.env.USERS_TABLE!, 'phoneNumber');

export const handler = async (event: any) => {
    const { currentPassword, newPassword } = JSON.parse(event.body);

    const tokenData = await validateToken(event.headers.Authorization);
    if(!tokenData) {
        return responseHelper("Token de usuario no válido", undefined, HTTP_ERROR_CODES.BAD_REQUEST);
    }

    const userData = await usersDB.getItem(tokenData.phoneNumber);
    
    if(!userData) {
        return responseHelper("Datos del usuario no encontrados", undefined, HTTP_ERROR_CODES.NOT_FOUND)
    }
   
    const passwordsMatch = await compare(currentPassword, userData.password);

    if(!passwordsMatch) {
        return responseHelper("Tu contraseña actual no es la correcta", undefined, HTTP_ERROR_CODES.BAD_REQUEST);
    }
    
    const encpriptedPasswrod = await hash(newPassword, 10);
    userData.password = encpriptedPasswrod;
    
    try {
        await usersDB.updateItem(userData.phoneNumber, {
            password: userData.password
        });
    } catch (error) {
        return responseHelper("Error actualizando la informasión del usuario", undefined, HTTP_ERROR_CODES.INTERNAL_SERVER_ERROR);
    }

    return responseHelper("Success");
}