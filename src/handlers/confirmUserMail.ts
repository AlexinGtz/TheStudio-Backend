import { HTTP_ERROR_CODES } from "../constants";
import { CustomDynamoDB } from "../dynamodb/database";
import { responseHelper } from "../helpers/responseHelper";
import * as jwt from 'jsonwebtoken';

const usersDB = new CustomDynamoDB(process.env.USERS_TABLE!, 'phoneNumber');

export const handler = async (event: any) => {
    const body = JSON.parse(event.body);

    const { userPhoneNumber, userEmail } = body;

    if(!userPhoneNumber) {
        return responseHelper("No hay número telefónico", undefined, HTTP_ERROR_CODES.BAD_REQUEST);
    }

    const userData = await usersDB.getItem(userPhoneNumber);

    if(!userData) {
        return responseHelper("Datos del usuario no encontrados", undefined, HTTP_ERROR_CODES.NOT_FOUND)
    }

    if(userEmail !== userData.email) {
        return responseHelper("El Correo no coincide con el registrado", undefined, HTTP_ERROR_CODES.BAD_REQUEST)
    }

    const token = jwt.sign(
        {
            phoneNumber: userData.phoneNumber,
        }, 
        process.env.JWT_SECRET!,
        {expiresIn: '24h'}
    )

    return responseHelper("Success", {
        token,
    });
}