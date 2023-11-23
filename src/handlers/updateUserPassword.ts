import { compare, hash } from "bcryptjs";
import { HTTP_ERROR_CODES } from "../constants";
import { CustomDynamoDB } from "../dynamodb/database";
import { responseHelper } from "../helpers/responseHelper";
import { validateToken } from "../helpers/validateToken";

const usersDB = new CustomDynamoDB(process.env.USERS_TABLE!, 'phoneNumber');

export const handler = async (event: any) => {
    const { currentPassword, newPassword, resetPassword } = JSON.parse(event.body);

    const tokenData = await validateToken(event.headers.Authorization);
    if(!tokenData) {
        return responseHelper("User token not valid", undefined, HTTP_ERROR_CODES.BAD_REQUEST);
    }

    const userData = await usersDB.getItem(tokenData.phoneNumber);
    
    if(!userData) {
        return responseHelper("User data not found", undefined, HTTP_ERROR_CODES.NOT_FOUND)
    }

    if(!resetPassword) {
        const passwordsMatch = await compare(currentPassword, userData.password);

        if(!passwordsMatch) {
            return responseHelper("Tu contraseña actual no es la correcta", undefined, HTTP_ERROR_CODES.BAD_REQUEST);
        }
    }

    const encpriptedPasswrod = await hash(newPassword, 10);
    userData.password = encpriptedPasswrod;
    
    try {
        await usersDB.updateItem(userData.phoneNumber, {
            password: userData.password
        });
    } catch (error) {
        return responseHelper("Error updating user information", undefined, HTTP_ERROR_CODES.INTERNAL_SERVER_ERROR);
    }

    return responseHelper("Success");
}