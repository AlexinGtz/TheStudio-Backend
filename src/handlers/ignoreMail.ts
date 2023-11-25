import { HTTP_ERROR_CODES } from '../constants';
import { CustomDynamoDB } from '../dynamodb/database';
import { responseHelper } from '../helpers/responseHelper';

const usersDB = new CustomDynamoDB(process.env.USERS_TABLE!, 'phoneNumber');

export const handler = async (event: any) => {
    const { email } = event.queryStringParameters;

    const userData = await usersDB.query(email, undefined, undefined, 'email-index');

    try {
        await usersDB.updateItem(userData[0].phoneNumber, {
            emailEnabled: false,
        });
    } catch (err) {
        return responseHelper('Error actualizando', undefined, HTTP_ERROR_CODES.INTERNAL_SERVER_ERROR);
    }

    return responseHelper("Success");
}
