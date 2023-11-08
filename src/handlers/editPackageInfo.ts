import { HTTP_ERROR_CODES, USER_TYPES } from "../constants";
import { CustomDynamoDB } from "../dynamodb/database";
import { responseHelper } from "../helpers/responseHelper";
import { validateToken } from "../helpers/validateToken";

const packagesDB = new CustomDynamoDB(process.env.PACKAGES_TABLE!, 'id');

export const handler = async (event: any) => {
    const tokenData = await validateToken(event.headers.Authorization);
    if(!tokenData) {
        return responseHelper("User token not valid", undefined, HTTP_ERROR_CODES.BAD_REQUEST);
    }

    if(tokenData.userType !== USER_TYPES.ADMIN) {
        return responseHelper("Accion no permitida", undefined, HTTP_ERROR_CODES.FORBIDDEN);
    }

    const packageInfo = JSON.parse(event.body);

    const newPackageInfo = {...packageInfo, updatedAt: new Date().toISOString()}

    delete newPackageInfo.id;

    try {
        await packagesDB.updateItem(packageInfo.id, newPackageInfo);
    } catch (error) {
        return responseHelper("Error updating package information", undefined, HTTP_ERROR_CODES.INTERNAL_SERVER_ERROR);
    }

    return responseHelper("Success");
}