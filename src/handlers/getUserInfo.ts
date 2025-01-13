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

    if (tokenData.userType !== 'admin') {
        return responseHelper("Acción solo permitida a administradores", undefined, HTTP_ERROR_CODES.UNAUTHORIZED);
    }

    const { userPhoneNumber } = event.queryStringParameters;

    if(!userPhoneNumber) {
        return responseHelper("No hay número telefónico", undefined, HTTP_ERROR_CODES.BAD_REQUEST);
    }

    const userData = await usersDB.getItem(userPhoneNumber);

    if(!userData) {
        return responseHelper("Datos del usuario no encontrados", undefined, HTTP_ERROR_CODES.NOT_FOUND)
    }

    return responseHelper("Success", {
        firstName: userData.firstName,
        lastName: userData.lastName,
        phoneNumber: userData.phoneNumber,
        purchasedPackages: userData.purchasedPackages,
        userType: userData.userType,
        bookedClasses: userData.bookedClasses,
        emailEnabled: userData.emailEnabled,
        trialClassAvailable: userData.trialClassAvailable,
    });
}