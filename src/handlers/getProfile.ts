import { HTTP_ERROR_CODES } from "../constants";
import { CustomDynamoDB } from "../dynamodb/database";
import { validateToken } from "../helpers/validateToken";

const usersDB = new CustomDynamoDB(process.env.USERS_TABLE!, 'id');

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

    const userData = await usersDB.getItem(tokenData.id);

    if(!userData) {
        return {
            statusCode: HTTP_ERROR_CODES.NOT_FOUND,
            body: JSON.stringify({
                message: "User data not found"
            })
        }
    }

    return {
        statusCode: 200,
        body: JSON.stringify({
            id: userData.id,
            firstName: userData.firstName,
            lastName: userData.lastName,
            phoneNumber: userData.phoneNumber,
            purchasedPackages: userData.purchasedPackages,
            bookedClasses: userData.bookedClasses,
            whatsappNOtifications: userData.whatsappNOtifications
        })
    }
}