import { hash } from 'bcryptjs'
import { CustomDynamoDB } from '../dynamodb/database';
import { HTTP_ERROR_CODES, USER_TYPES } from '../constants';
import { responseHelper } from "../helpers/responseHelper";
import { sendMail } from '../helpers/emailHelper';
import registerTemplate from '../helpers/emailTemplates/registerTemplate';

const database = new CustomDynamoDB(process.env.USERS_TABLE!, 'phoneNumber');

export const handler = async (event) => {
    const body = JSON.parse(event.body);

    const { 
        phoneNumber, 
        password, 
        firstName, 
        lastName,
        email
    } = body;

    const existingUser = await database.getItem(phoneNumber);

    if(existingUser) {
        return responseHelper("Usuario ya registrado", undefined, HTTP_ERROR_CODES.BAD_REQUEST);
    }

    const encriptedPassword = await hash(password, 10);

    await database.putItem({
        phoneNumber,
        firstName,
        lastName,
        email,
        password: encriptedPassword,
        userType: USER_TYPES.USER,
        deleted: false,
        emailEnabled: true,
        bookedClasses: [],
        purchasedPackages: [],
        trialClassAvailable: true
    });

    try {
        await sendMail(registerTemplate({
            email,
        }));
    }	catch (error) {
        console.log(error);
    }
    return responseHelper('Perfil creado satisfactoriamente');
}