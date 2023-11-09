import { HTTP_ERROR_CODES, USER_TYPES } from "../constants";
import { CustomDynamoDB } from "../dynamodb/database";
import { validateToken } from "../helpers/validateToken";
import { responseHelper } from "../helpers/responseHelper";

const classesDB = new CustomDynamoDB(process.env.CLASSES_TABLE!, 'month', 'date');
const usersDB = new CustomDynamoDB(process.env.USERS_TABLE!, 'phoneNumber');

export const handler = async (event: any) => {
    const tokenData = await validateToken(event.headers.Authorization);
    if(!tokenData) {
        return responseHelper("User token not valid", undefined, HTTP_ERROR_CODES.BAD_REQUEST);
    }

    const today = new Date();

    const { classDate, userId } = JSON.parse(event.body);

    const classDateObj = new Date(classDate);

    const [userInfo, classInfo] = await Promise.all([
        usersDB.getItem(tokenData.phoneNumber),
        classesDB.getItem((classDateObj.getMonth() + 1).toString(), classDate),
    ]);

    if(!userInfo || !classInfo) {
        return responseHelper("Error retrieving user or class information", undefined, HTTP_ERROR_CODES.NOT_FOUND);
    }

    if(classInfo.cancelled) {
        return responseHelper("Class already cancelled", undefined, HTTP_ERROR_CODES.BAD_REQUEST);
    }

    if( (userInfo.userType === USER_TYPES.ADMIN && userId)
        || userInfo.userType === USER_TYPES.USER) {

        const user = userInfo.userType === USER_TYPES.ADMIN ? 
            await usersDB.getItem(userId) : userInfo; 
        
        if (!user) {
            return responseHelper("Error retrieving user information", undefined, HTTP_ERROR_CODES.NOT_FOUND);
        }

        const regUser = classInfo.registeredUsers.find(e => e.phoneNumber === user.phoneNumber);
        if(!regUser) {
            return responseHelper(
                "Cannot cancel class because the user is not registered", 
                undefined, 
                HTTP_ERROR_CODES.BAD_REQUEST);
        }
        
        const classDate = new Date(classInfo.date);
        const timeDifferenceInMS = classDate.getTime() - today.getTime();

        if((timeDifferenceInMS/1000) > 86400) {
            for(let p of user?.purchasedPackages) {
                const pDate = new Date(p.expireDate)
                if(today < pDate){
                    p.availableClasses += 1;
                    break;
                }
            }
        }

        classInfo.registeredUsers = classInfo.registeredUsers.filter(e => e.phoneNumber !== user.phoneNumber);
        const newBookedClasses = user.bookedClasses.filter((c) => c.sk !== classInfo.date);

        await Promise.all([
            usersDB.updateItem(user.phoneNumber,{
                purchasedPackages: user!.purchasedPackages,
                bookedClasses: newBookedClasses,
            }),
            classesDB.updateItem(classInfo.month,{registeredUsers: classInfo!.registeredUsers}, classInfo.date)
        ])

        return responseHelper('Succesfully cancelled class');

    } else {
        await classesDB.updateItem(classInfo.month,{cancelled: true}, classInfo.date)
        if(classInfo.registeredUsers.length === 0) return responseHelper('Succesfully cancelled class');
        const users = await usersDB.batchGetById(classInfo.registeredUsers.map(user => ({
            pk: user.phoneNumber
        })));
        users.forEach(user => {
            for(let p of user.purchasedPackages) {
                const pDate = new Date(p.expireDate)
                if(today < pDate){
                    p.availableClasses += 1;
                    break;
                }
            }
        });

        await Promise.all(users.map(user => usersDB.updateItem(user.phoneNumber, {purchasedPackages: user.purchasedPackages} )))

        return responseHelper('Succesfully cancelled class');
    }
}