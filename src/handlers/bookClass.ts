import { CustomDynamoDB } from "../dynamodb/database";
import { validateToken } from "../helpers/validateToken"
import { HTTP_ERROR_CODES } from "../constants";
import { responseHelper } from "../helpers/responseHelper";

const classesDB = new CustomDynamoDB(process.env.CLASSES_TABLE!, 'month', 'date');
const usersDB = new CustomDynamoDB(process.env.USERS_TABLE!, 'phoneNumber');

export const handler = async (event: any) => {
    const tokenData = await validateToken(event.headers.Authorization);
    if(!tokenData) {
        return responseHelper("User token not valid", undefined, HTTP_ERROR_CODES.BAD_REQUEST);
    }

    const userInfo = await usersDB.getItem(tokenData.id);

    if(!userInfo) {
        return responseHelper("Error retrieving user information", undefined, HTTP_ERROR_CODES.NOT_FOUND);
    }

    let selectedPackage;
    const today = new Date();

    for(let p of userInfo?.purchasedPackages) {
        const pDate = new Date(p.expireDate)
        if(p.availableClasses > 0 && today < pDate){
            selectedPackage = p;
            break;
        }
    }

    if(!selectedPackage) {
        return responseHelper("User cannot book a class", undefined, HTTP_ERROR_CODES.BAD_REQUEST);
    }

    const body= JSON.parse(event.body);

    const { classDate } = body;

    const classDateObj = new Date(classDate);

    const classInfo = await classesDB.getItem((classDateObj.getMonth() + 1).toString(), classDate);

    if(!classInfo) {
        return responseHelper("Class information not found", undefined, HTTP_ERROR_CODES.NOT_FOUND);
    }

    if(classInfo.canceled || classInfo?.registeredUsers.length === classInfo?.maxUsers) {
        return responseHelper("User cannot book class", undefined, HTTP_ERROR_CODES.BAD_REQUEST);
    }

    classInfo.registeredUsers.push({id: userInfo!.id});
    selectedPackage.availableClasses = selectedPackage.availableClasses - 1;
    userInfo.bookedClasses.push({pk: classInfo.month, sk: classInfo.date});

    await Promise.all([
        usersDB.updateItem(userInfo.id,
            {
                purchasedPackages: userInfo!.purchasedPackages,
                bookedClasses: userInfo.bookedClasses
            }
            ),
        classesDB.updateItem(classInfo.date,{registeredUsers: classInfo!.registeredUsers}, classInfo.month)
    ])

    return responseHelper("Succesfully booked class");
}