import { HTTP_ERROR_CODES, USER_TYPES } from "../constants";
import { CustomDynamoDB } from "../dynamodb/database";
import { msInADay } from "../constants";
import { validateToken } from "../helpers/validateToken";
import { responseHelper } from "../helpers/responseHelper";

const usersDB = new CustomDynamoDB(process.env.USERS_TABLE!, 'phoneNumber');
const packagesDB = new CustomDynamoDB(process.env.PACKAGES_TABLE!, 'id');

export const handler = async (event: any) => {
    const tokenData = await validateToken(event.headers.Authorization);
    if(!tokenData) {
        return responseHelper("Token de usuario no válido", undefined, HTTP_ERROR_CODES.BAD_REQUEST);
    }

    if(tokenData.userType !== USER_TYPES.ADMIN) {
        return responseHelper("Sólo los admins pueden hacer esta acción", undefined, HTTP_ERROR_CODES.FORBIDDEN);
    }

    const body = JSON.parse(event.body);

    const { userPhoneNumber, packageId } = body;

    const [userInfo, packageInfo ] = await Promise.all([
        usersDB.getItem(userPhoneNumber),
        packagesDB.getItem(packageId)
    ]);

    if(!userInfo || !packageInfo) {
        return responseHelper(
            "Datos no encontrados", 
            undefined, 
            HTTP_ERROR_CODES.NOT_FOUND);
    }
    
    const expireDate = new Date();
    expireDate.setTime(expireDate.getTime() + msInADay * packageInfo.expireDays)

    if(packageInfo.classType === "COMBINED") {
        userInfo.purchasedPackages.push({
            availableClasses: packageInfo.classQuantity,
            expireDate: expireDate.toISOString(),
            totalClasses: packageInfo.classQuantity,
            purchasedDate: new Date().toISOString(),
            type: 'PILATES',
        });

        userInfo.purchasedPackages.push({
            availableClasses: packageInfo.classQuantity,
            expireDate: expireDate.toISOString(),
            totalClasses: packageInfo.classQuantity,
            purchasedDate: new Date().toISOString(),
            type: 'WELLNESS',
        })
    } else {
        userInfo.purchasedPackages.push({
            availableClasses: packageInfo.classQuantity,
            expireDate: expireDate.toISOString(),
            totalClasses: packageInfo.classQuantity,
            purchasedDate: new Date().toISOString(),
            type: packageInfo.classType,
        })
    }

    await usersDB.updateItem(userInfo.phoneNumber,{purchasedPackages: userInfo.purchasedPackages})
    
    return responseHelper("Paquete añadido al usuario");
}