import { CustomDynamoDB } from "../dynamodb/database";
import { compare } from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { responseHelper } from "../helpers/responseHelper";
import { HTTP_ERROR_CODES } from "../constants";

const usersDB = new CustomDynamoDB(process.env.USERS_TABLE!, 'phoneNumber');

export const handler = async (event) => {
    const body = JSON.parse(event.body);

    const { phoneNumber, password } = body;

    const user = await usersDB.getItem(phoneNumber);

    if(!user) {
        return responseHelper("User not in DB", undefined, HTTP_ERROR_CODES.NOT_FOUND);
    }

    const passwordsMatch = await compare(password, user.password);

    if(!passwordsMatch) {
        return responseHelper("Passwords doesn't  match", undefined, HTTP_ERROR_CODES.BAD_REQUEST);
    }

    const token = jwt.sign(
        {
            phoneNumber, 
            firstName: user.firstName, 
            lastName: user.lastName,
            id: user.id,
            userType: user.userType
        }, 
        process.env.JWT_SECRET!,
        {expiresIn: '24h'}
    )

    return responseHelper('Successfully logged in', {
        userType: user.userType,
        id: user.id,
        phoneNumber: user.phoneNumber,
        token,
        expiresIn: 3600*24
    })
}