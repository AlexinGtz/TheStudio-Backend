import { HTTP_ERROR_CODES, USER_TYPES } from "../constants";
import { CustomDynamoDB } from "../dynamodb/database";
import { validateToken } from "../helpers/validateToken";
import { responseHelper } from "../helpers/responseHelper";
import { selectEarliestPackage } from "../helpers/packageHelper";

const usersDB = new CustomDynamoDB(process.env.USERS_TABLE!, 'phoneNumber');

export const handler = async (event: any) => {
    const tokenData = await validateToken(event.headers.Authorization);
    if(!tokenData) {
        return responseHelper("Token de usuario no válido", undefined, HTTP_ERROR_CODES.BAD_REQUEST);
    }

    if(tokenData.userType !== USER_TYPES.ADMIN) {
            return responseHelper("Accion no permitida", undefined, HTTP_ERROR_CODES.FORBIDDEN);
    }    

    const { phoneNumber } = JSON.parse(event.body);

    if(!phoneNumber) {
        return responseHelper("No se mando el numero de telefono", undefined, HTTP_ERROR_CODES.BAD_REQUEST);
    }

    const userInfo = await usersDB.getItem(phoneNumber);

    if(!userInfo) {
        return responseHelper(
            "Datos no encontrados", 
            undefined, 
            HTTP_ERROR_CODES.NOT_FOUND);
    }

    if(!userInfo.trialClassAvailable) {
        return responseHelper(
            "No hay clases de prueba disponibles", 
            undefined, 
            HTTP_ERROR_CODES.BAD_REQUEST);
    }

    const selectedPackage = userInfo.purchasedPackages[0];
    selectedPackage.availableClasses -= 1;

    await usersDB.updateItem(userInfo.phoneNumber,{purchasedPackages: userInfo.purchasedPackages, trialClassAvailable: false});

    return responseHelper('Success');
}