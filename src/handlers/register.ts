import { hash } from 'bcrypt'
import { CustomDynamoDB } from '../dynamodb/database';
import { v4 as uuidv4 } from 'uuid';

const database = new CustomDynamoDB(process.env.USERS_TABLE!, 'id')

export const handler = async (event) => {
    const body = JSON.parse(event.body);

    const { 
        phoneNumber, 
        password, 
        firstName, 
        lastName 
    } = body;

    const encriptedPassword = await hash(password, 10);

    const result = await database.putItem({
        id: uuidv4(),
        phoneNumber,
        firstName,
        lastName,
        password: encriptedPassword,
        userType: 'user'
    });

    //Send Whatsapp

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Successfully created profile'
        })
    }
}