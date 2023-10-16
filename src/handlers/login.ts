import { CustomDynamoDB } from "../dynamodb/database";
import { compare } from 'bcrypt';
import * as jwt from 'jsonwebtoken';

const usersDB = new CustomDynamoDB(process.env.USERS_TABLE!, 'id');

export const handler = async (event) => {
    const body = JSON.parse(event.body);

    const { phoneNumber, password } = body;

    const user = await usersDB.getByIndex('phone-index', 'phoneNumber', phoneNumber);
    console.log('user', user);

    if(!user) {
        //error
        return {
            statusCode: 404,
            body: JSON.stringify({
                message: "user not in DB"
            })
        }
    }

    const passwordsMatch = await compare(password, user.password);

    if(!passwordsMatch) {
        //error
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: "Passwords doesn't  match"
            })
        }
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
        {expiresIn: '1h'}
    )

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Successfully created profile',
            userType: user.userType,
            id: user.id,
            phoneNumber: user.phoneNumber,
            token,
            expiresIn: 3600
        })
    }
}