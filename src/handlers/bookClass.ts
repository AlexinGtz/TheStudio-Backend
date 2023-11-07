import { CustomDynamoDB } from "../dynamodb/database";
import { validateToken } from "../helpers/validateToken"
import { HTTP_ERROR_CODES } from "../constants";
import { responseHelper } from "../helpers/responseHelper";
import { selectEarliestPackage } from "../helpers/packageHelper";

const classesDB = new CustomDynamoDB(process.env.CLASSES_TABLE!, 'month', 'date');
const usersDB = new CustomDynamoDB(process.env.USERS_TABLE!, 'phoneNumber');

export const handler = async (event: any) => {
    const tokenData = await validateToken(event.headers.Authorization);
    if(!tokenData) {
        return responseHelper("User token not valid", undefined, HTTP_ERROR_CODES.BAD_REQUEST);
    }

    const userInfo = await usersDB.getItem(tokenData.phoneNumber);

    if(!userInfo) {
        return responseHelper("Error retrieving user information", undefined, HTTP_ERROR_CODES.NOT_FOUND);
    }

    const { classDate } = JSON.parse(event.body);
    const classDateObj = new Date(classDate);

    const classAlreadyBooked = userInfo.bookedClasses.find((c) => c.sk === classDate);

    if(classAlreadyBooked || classDateObj < new Date()) { 
        return responseHelper("Esa clase ya la tiene agendada", undefined, HTTP_ERROR_CODES.BAD_REQUEST);
    }

    const selectedPackage = selectEarliestPackage(userInfo.purchasedPackages);

    if(!selectedPackage || selectedPackage.availableClasses <= 0) {
        return responseHelper("No tienes clases disponibles", undefined, HTTP_ERROR_CODES.BAD_REQUEST);
    }
    
    const classInfo = await classesDB.getItem((classDateObj.getMonth() + 1).toString(), classDate);

    if(!classInfo) {
        return responseHelper("La clase seleccionada no existe", undefined, HTTP_ERROR_CODES.NOT_FOUND);
    }

    if(classInfo.cancelled || classInfo?.registeredUsers.length === classInfo?.maxUsers) {
        return responseHelper("User cannot book class", undefined, HTTP_ERROR_CODES.BAD_REQUEST);
    }

    classInfo.registeredUsers.push({
        phoneNumber: userInfo.phoneNumber,
        firstName: userInfo.firstName,
        lastName: userInfo.lastName
    });

    selectedPackage.availableClasses = selectedPackage.availableClasses - 1;
    userInfo.bookedClasses.push({pk: classInfo.month, sk: classInfo.date});

    await Promise.all([
        usersDB.updateItem(userInfo.phoneNumber,
            {
                purchasedPackages: userInfo!.purchasedPackages,
                bookedClasses: userInfo.bookedClasses
            }
            ),
        classesDB.updateItem(classInfo.month,{registeredUsers: classInfo!.registeredUsers}, classInfo.date)
    ])

    return responseHelper("Succesfully booked class");
}