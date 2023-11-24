import { CustomDynamoDB } from "../dynamodb/database";
import { HTTP_ERROR_CODES } from "../constants";
import { responseHelper } from "../helpers/responseHelper";
import { sendMail } from "../helpers/emailHelper";
import resetPasswordCodeTemplate from "../helpers/emailTemplates/resetPasswordCodeTemplate";

const usersDB = new CustomDynamoDB(process.env.USERS_TABLE!, 'phoneNumber');
const codesDB = new CustomDynamoDB(process.env.CODES_TABLE!, 'phoneNumber');

const generateCode = () => {
    const codeLength = 6;
    const characters = '0123456789';
    let code = '';

    for (let i = 0; i < codeLength; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        code += characters[randomIndex];
    }

    return code;
};

export const handler = async (event: any) => {
    const { phoneNumber } = event.queryStringParameters;

    const userData = await usersDB.getItem(phoneNumber);

    if(!userData) {
        return responseHelper("User data not found", undefined, HTTP_ERROR_CODES.NOT_FOUND)
    }

    const ttl = Date.now() + 1000 * 3600; //1 hour
    const code = generateCode();

    const res = await codesDB.putItem({
        phoneNumber,
        code,
        ttl
    });

    if(!res) {
        return responseHelper("Error saving code", undefined, HTTP_ERROR_CODES.INTERNAL_SERVER_ERROR);
    }

    try {
        await sendMail(resetPasswordCodeTemplate({ code, email: userData.email }));
    } catch (error) {
        console.log('SEND MAIL ERROR', error);
        return responseHelper("Error mandando correo, intente de nuevo mas tarde", undefined, HTTP_ERROR_CODES.INTERNAL_SERVER_ERROR);
    }

    return responseHelper("Success");
}

