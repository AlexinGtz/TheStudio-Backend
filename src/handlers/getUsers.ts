import { HTTP_ERROR_CODES } from "../constants";
import { CustomDynamoDB } from "../dynamodb/database";
import { validateToken } from "../helpers/validateToken";
import { responseHelper } from "../helpers/responseHelper";

const usersDB = new CustomDynamoDB(process.env.USERS_TABLE!, 'phoneNumber');

export const handler = async (event: any) => {
    const tokenData = await validateToken(event.headers.Authorization);
    if(!tokenData) {
        return responseHelper("User token not valid", undefined, HTTP_ERROR_CODES.BAD_REQUEST);
    }

    if(!tokenData.userType || tokenData.userType !== "admin") {
        return responseHelper("Only Admins can use this endpoint", undefined, HTTP_ERROR_CODES.FORBIDDEN)
    }

    const { lastEvaluatedKey } = event.queryStringParameters ?? {};

    const usersData = await usersDB.scan(50, lastEvaluatedKey);

    if(!usersData) {
        return responseHelper("User data not found", undefined, HTTP_ERROR_CODES.NOT_FOUND)
    }

    //TODO: Get Profile Picture

    const users = usersData.items.map(user => ({
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        purchasedPackages: user.purchasedPackages,
        userType: user.userType,
        bookedClasses: user.bookedClasses,
        emailEnabled: user.emailEnabled,
        deleted: user.deleted,
    }));

    const filteredUsers = users.filter(user => {
        if(user.deleted) {
            return false;
        }
        else if(user.userType === "admin" || user.userType === "dev") {
            return false;
        }
        return true;
    });

    return responseHelper("Success", { 
        users: filteredUsers,
        lastEvaluatedKey: usersData.lastEvaluatedKey,
    });
}