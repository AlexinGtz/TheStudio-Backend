import { CustomDynamoDB } from "../dynamodb/database";
import { validateToken } from "../helpers/validateToken"
import { HTTP_ERROR_CODES } from "../constants";

const classesDB = new CustomDynamoDB(process.env.CLASSES_TABLE!, 'id');
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
        return {
            statusCode: HTTP_ERROR_CODES.NOT_FOUND,
            body: JSON.stringify({
                message: "Error retrieving user information"
            })
        }
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
        return {
            statusCode: HTTP_ERROR_CODES.BAD_REQUEST,
            body: JSON.stringify({
                message: "User cannot book a class"
            })
        }
    }

    const body= JSON.parse(event.body);

    const { classId } = body;

    const classInfo = await classesDB.getItem(classId);

    if(!classInfo) {
        //Error
        return {}
    }

    if(classInfo.canceled || classInfo?.registeredUsers.length === classInfo?.maxUsers) {
        //Error: Cannot book class
        return {}
    }

    classInfo.registeredUsers.push({id: userInfo!.id});
    selectedPackage.availableClasses = selectedPackage.availableClasses - 1;

    await Promise.all([
        usersDB.updateItem(userInfo.id,{purchasedPackages: userInfo!.purchasedPackages}),
        classesDB.updateItem(classInfo.id,{registeredUsers: classInfo!.registeredUsers})
    ])

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: "Succesfully booked class"
        })
    }
}