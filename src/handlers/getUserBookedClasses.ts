import { HTTP_ERROR_CODES } from "../constants";
import { CustomDynamoDB } from "../dynamodb/database";
import { validateToken } from "../helpers/validateToken";
import { responseHelper } from "../helpers/responseHelper";

const classesDB = new CustomDynamoDB(process.env.CLASSES_TABLE!, 'month', 'date_by_type');
const usersDB = new CustomDynamoDB(process.env.USERS_TABLE!, 'phoneNumber');

export const handler = async (event: any) => {
    const tokenData = await validateToken(event.headers.Authorization);
    if(!tokenData) {
        return responseHelper("Token de usuario no válido", undefined, HTTP_ERROR_CODES.BAD_REQUEST);
    }
    
    const userInfo = await usersDB.getItem(tokenData.phoneNumber);


    if(!userInfo) {
        return responseHelper("Datos del usuario no encontrados", undefined, HTTP_ERROR_CODES.NOT_FOUND);
    }

    const today = new Date();
    
    if (!userInfo.bookedClasses || userInfo.bookedClasses.length === 0) {
        return responseHelper('Success', {classes: []});
    }    

    const filteredBookedClasses = userInfo.bookedClasses.filter((c) => c.sk.split('#')[0] > today.toISOString());
    
    const classes = await classesDB.batchGetById(filteredBookedClasses);

    const filteredClasses = classes.filter((c) => !c.cancelled);

    return responseHelper('Success', {classes: filteredClasses});
}