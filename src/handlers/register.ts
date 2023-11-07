import { hash } from 'bcryptjs'
import { CustomDynamoDB } from '../dynamodb/database';
import { HTTP_ERROR_CODES, USER_TYPES } from '../constants';
import { responseHelper } from "../helpers/responseHelper";

const database = new CustomDynamoDB(process.env.USERS_TABLE!, 'phoneNumber');

export const handler = async (event) => {
    const body = JSON.parse(event.body);

    const { 
        phoneNumber, 
        password, 
        firstName, 
        lastName 
    } = body;

    const existingUser = await database.getItem(phoneNumber);

    if(existingUser) {
        return responseHelper("User already in DB", undefined, HTTP_ERROR_CODES.BAD_REQUEST);
    }

    const encriptedPassword = await hash(password, 10);

    await database.putItem({
        phoneNumber,
        firstName,
        lastName,
        password: encriptedPassword,
        userType: USER_TYPES.USER,
        deleted: false,
        whatsappNotifications: true,
        bookedClasses: [],
        purchasedPackages: []
    });

    //Send Whatsapp

    return responseHelper('Successfully created profile');
}