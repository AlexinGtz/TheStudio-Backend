import { HTTP_ERROR_CODES, USER_TYPES } from "../constants";
import { CustomDynamoDB } from "../dynamodb/database";
import { msInADay } from "../helpers/constants";
import { validateToken } from "../helpers/validateToken";

const usersDB = new CustomDynamoDB(process.env.USERS_TABLE!, 'id');
const packagesDB = new CustomDynamoDB(process.env.PACKAGES_TABLE!, 'id');

export const handler = async (event: any) => {
    const tokenData = await validateToken(event.headers.Authorization);
    if(!tokenData) {
        return {
            statusCode: HTTP_ERROR_CODES.BAD_REQUEST,
            body: JSON.stringify({
                message: "User token not valid"
            })
        }
        
    }

    if(tokenData.userType !== USER_TYPES.ADMIN) {
        return {
            statusCode: HTTP_ERROR_CODES.FORBIDDEN,
            body: JSON.stringify({
                message: "Action forbidden"
            })
        }
    }

    const body = JSON.parse(event.body);

    const { userId, packageId } = body;

    const [userInfo, packageInfo ] = await Promise.all([
        usersDB.getItem(userId),
        packagesDB.getItem(packageId)
    ]);

    if(!userInfo || !packageInfo) {
        return {}
    }

    const expireDate = new Date();

    expireDate.setTime(expireDate.getTime() + msInADay * packageInfo.expireDays)

    userInfo.purchasedPackages.push({
        availableClasses: packageInfo.classQuantity,
        expireDate: expireDate.toISOString()
    })

    await usersDB.updateItem(userInfo.id,{purchasedPackages: userInfo!.purchasedPackages})
    
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: "Succesfully added package to user"
        })
    }
}