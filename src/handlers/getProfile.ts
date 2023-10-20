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

    const userData = await usersDB.getItem(tokenData.id);

    if(!userData) {
        return responseHelper("User data not found", undefined, HTTP_ERROR_CODES.NOT_FOUND)
    }

    //TODO: Get Profile Picture

    return responseHelper("Success", {
        id: userData.id,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phoneNumber: userData.phoneNumber,
        purchasedPackages: userData.purchasedPackages,
        bookedClasses: userData.bookedClasses,
        whatsappNOtifications: userData.whatsappNOtifications
    });
}