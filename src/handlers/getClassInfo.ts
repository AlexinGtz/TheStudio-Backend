import { HTTP_ERROR_CODES } from "../constants";
import { CustomDynamoDB } from "../dynamodb/database";
import { responseHelper } from "../helpers/responseHelper";
import { validateToken } from "../helpers/validateToken";

const classesDB = new CustomDynamoDB(process.env.CLASSES_TABLE!, 'month', 'date');

export const handler = async (event: any) => {
    const tokenData = await validateToken(event.headers.Authorization);
    if(!tokenData) {
        return responseHelper("User token not valid", undefined, HTTP_ERROR_CODES.BAD_REQUEST);
    }

    const { classDate } = event.queryStringParameters;
    const classDateObj = new Date(classDate);
    const classInfo = await classesDB.getItem((classDateObj.getMonth() + 1).toString(), classDate);

    if(!classInfo || classInfo.cancelled) {
        return responseHelper("Class information not found", undefined, HTTP_ERROR_CODES.NOT_FOUND);
    }



    return {
        statusCode: 200,
        body: JSON.stringify({
            ...classInfo,
        }),
    };
}