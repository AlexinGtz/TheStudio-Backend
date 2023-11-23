import { hash } from "bcryptjs";
import { CustomDynamoDB } from "../dynamodb/database";
import { HTTP_ERROR_CODES } from "../constants";
import { responseHelper } from "../helpers/responseHelper";
import { sendMail } from "../helpers/emailHelper";
import resetPasswordConfirmationTemplate from "../helpers/emailTemplates/resetPasswordConfirmationTemplate";

const usersDB = new CustomDynamoDB(process.env.USERS_TABLE!, 'phoneNumber');
const codesDB = new CustomDynamoDB(process.env.CODES_TABLE!, 'phoneNumber', 'date');

const generatePassword = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 10; i++) {
        password += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return password;
};

export const handler = async (event: any) => {
    const { phoneNumber, verificationCode } = JSON.parse(event.body);

    const userData = await usersDB.getItem(phoneNumber);
    const codeData = await codesDB.query(phoneNumber);

    if(!userData || !codeData || codeData.length === 0) {
        return responseHelper("User or Code data not found", undefined, HTTP_ERROR_CODES.NOT_FOUND)
    }


    const code = codeData[0].code;

    if(code !== verificationCode) {
        return responseHelper("Invalid verification code", undefined, HTTP_ERROR_CODES.BAD_REQUEST)
    }

    const newPassword = generatePassword();

    const encpriptedPasswrod = await hash(newPassword, 10);
    userData.password = encpriptedPasswrod;

    try {
        await usersDB.updateItem(userData.phoneNumber, {
            password: userData.password
        });
        await codesDB.deleteItem(phoneNumber, codeData[0].date);
        await sendMail(resetPasswordConfirmationTemplate({ newPassword: newPassword, email: userData.email }));
    } catch (error) {
        console.log('error', error);
        return responseHelper("Error updating user information", undefined, HTTP_ERROR_CODES.INTERNAL_SERVER_ERROR);
    }

    return responseHelper("Success");
}

