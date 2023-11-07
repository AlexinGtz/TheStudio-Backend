import { HTTP_ERROR_CODES } from "../constants";
import { CustomDynamoDB } from "../dynamodb/database";
import { responseHelper } from "../helpers/responseHelper";
import { validateToken } from "../helpers/validateToken";

const usersDB = new CustomDynamoDB(process.env.USERS_TABLE!, 'phoneNumber');

export const handler = async (event: any) => {
    const tokenData = await validateToken(event.headers.Authorization);
    if(!tokenData) {
        return responseHelper("User token not valid", undefined, HTTP_ERROR_CODES.BAD_REQUEST);
    }

    const { firstName, lastName } = JSON.parse(event.body);

    const userData = await usersDB.getItem(tokenData.phoneNumber);
    
    if(!userData) {
        return responseHelper("User data not found", undefined, HTTP_ERROR_CODES.NOT_FOUND)
    }

    userData.firstName = firstName ?? userData.firstName;
    userData.lastName = lastName ?? userData.lastName;


    try {
        await usersDB.updateItem(userData.phoneNumber, {
            firstName: userData.firstName,
            lastName: userData.lastName,
        });
    } catch (error) {
        console.log('error', error);
        return responseHelper("Error updating user information", undefined, HTTP_ERROR_CODES.INTERNAL_SERVER_ERROR);
    }


    return responseHelper("Success");
}