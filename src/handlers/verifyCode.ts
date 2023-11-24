import { CustomDynamoDB } from "../dynamodb/database";
import { HTTP_ERROR_CODES } from "../constants";
import { responseHelper } from "../helpers/responseHelper";
import * as jwt from 'jsonwebtoken';

const codesDB = new CustomDynamoDB(process.env.CODES_TABLE!, 'phoneNumber', 'date');

export const handler = async (event: any) => {
    const { phoneNumber, verificationCode } = JSON.parse(event.body);

    const codeData = await codesDB.query(phoneNumber);

    if(!codeData || codeData.length === 0) {
        return responseHelper("Código de verificacion no encontrado", undefined, HTTP_ERROR_CODES.NOT_FOUND)
    }

    const code = codeData[0].code;

    if(code !== verificationCode) {
        return responseHelper("Código de verificación no válido", undefined, HTTP_ERROR_CODES.BAD_REQUEST)
    }

    const token = jwt.sign(
        {
            phoneNumber,
        }, 
        process.env.JWT_SECRET!,
        {expiresIn: '24h'}
    )

    return responseHelper("Success", {token});
}

