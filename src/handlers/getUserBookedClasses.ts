import { HTTP_ERROR_CODES } from "../constants";
import { CustomDynamoDB } from "../dynamodb/database";
import { validateToken } from "../helpers/validateToken";
import { responseHelper } from "../helpers/responseHelper";

const classesDB = new CustomDynamoDB(process.env.CLASSES_TABLE!, 'month', 'date');
const usersDB = new CustomDynamoDB(process.env.USERS_TABLE!, 'id');

export const handler = async (event: any) => {
    const tokenData = await validateToken(event.headers.Authorization);
    if(!tokenData) {
        return responseHelper("User token not valid", null, HTTP_ERROR_CODES.BAD_REQUEST);
    }

    const userInfo = await usersDB.getItem(tokenData.id);

    if(!userInfo) {
        return responseHelper("User info not found", null, HTTP_ERROR_CODES.NOT_FOUND);
    }

    const today = new Date();
    const classes = await classesDB.batchGetById(userInfo.bookedClasses);

    const filteredClasses = classes.filter((c) => {
        const classDate = new Date(c.date);
        return classDate.getTime() > today.getTime();
    });

    return responseHelper('Success', {classes: filteredClasses});
}