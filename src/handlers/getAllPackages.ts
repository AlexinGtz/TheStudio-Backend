import { HTTP_ERROR_CODES } from "../constants";
import { CustomDynamoDB } from "../dynamodb/database";
import { validateToken } from "../helpers/validateToken";

const packagesDB = new CustomDynamoDB(process.env.PACKAGES_TABLE!, 'id');

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

    return {
        statusCode: 200,
        body: JSON.stringify({
            packages: await packagesDB.scan(),
        })
    }
}