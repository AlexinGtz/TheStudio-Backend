import { HTTP_ERROR_CODES, USER_TYPES } from "../constants";
import { CustomDynamoDB } from "../dynamodb/database";
import { msInADay } from "../constants";
import { validateToken } from "../helpers/validateToken";
import { responseHelper } from "../helpers/responseHelper";

const usersDB = new CustomDynamoDB(process.env.USERS_TABLE!, 'id');
const packagesDB = new CustomDynamoDB(process.env.PACKAGES_TABLE!, 'id');

export const handler = async (event: any) => {
    const tokenData = await validateToken(event.headers.Authorization);
    if(!tokenData) {
        return responseHelper("User token not valid", null, HTTP_ERROR_CODES.BAD_REQUEST);
    }

    if(tokenData.userType !== USER_TYPES.ADMIN) {
        return responseHelper("Action forbidden", null, HTTP_ERROR_CODES.FORBIDDEN);
    }

    const body = JSON.parse(event.body);

    const { userId, packageId } = body;

    const [userInfo, packageInfo ] = await Promise.all([
        usersDB.getItem(userId),
        packagesDB.getItem(packageId)
    ]);

    if(!userInfo || !packageInfo) {
        return responseHelper(
            "Data not found for user or package", 
            null, 
            HTTP_ERROR_CODES.NOT_FOUND);
    }

    const expireDate = new Date();

    expireDate.setTime(expireDate.getTime() + msInADay * packageInfo.expireDays)

    userInfo.purchasedPackages.push({
        availableClasses: packageInfo.classQuantity,
        expireDate: expireDate.toISOString()
    })

    await usersDB.updateItem(userInfo.id,{purchasedPackages: userInfo!.purchasedPackages})
    
    return responseHelper("Succesfully added package to user");
}