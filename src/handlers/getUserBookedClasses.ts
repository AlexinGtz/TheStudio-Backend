import { HTTP_ERROR_CODES } from "../constants";
import { CustomDynamoDB } from "../dynamodb/database";
import { validateToken } from "../helpers/validateToken";

const classesDB = new CustomDynamoDB(process.env.CLASSES_TABLE!, 'month', 'date');
const usersDB = new CustomDynamoDB(process.env.USERS_TABLE!, 'id');

export const handler = async (event: any) => {
    const tokenData = await validateToken(event.headers.Authorization);
    if(!tokenData) {
        return {
            statusCode: HTTP_ERROR_CODES.BAD_REQUEST,
            body: JSON.stringify({
                message: "User token not valid"
            })
        }
        
    }

    const userInfo = await usersDB.getItem(tokenData.id);

    if(!userInfo) {
        return {}
    }

    const today = new Date();
    const classes = await classesDB.batchGetById(userInfo.bookedClasses);

    const filteredClasses = classes.filter((c) => {
        const classDate = new Date(c.date);
        return classDate.getTime() > today.getTime();
    });

    return {
        statusCode: 200,
        body: JSON.stringify({
            classes: filteredClasses,
        })
    }
}