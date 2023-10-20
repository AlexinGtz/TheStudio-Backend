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

    const body= JSON.parse(event.body);
    const today = new Date();

    const { classDate, userId } = body;

    const classDateObj = new Date(classDate);

    const [userInfo, classInfo] = await Promise.all([
        usersDB.getItem(tokenData.id),
        classesDB.getItem((classDateObj.getMonth() + 1).toString(), classDate),
    ]);

    if(!userInfo || !classInfo) {
        return responseHelper("Error retrieving user or class information", undefined, HTTP_ERROR_CODES.NOT_FOUND);
    }

    if(classInfo.canceled) {
        return responseHelper("Class already canceled", undefined, HTTP_ERROR_CODES.BAD_REQUEST);
    }

    if( (userInfo.userType === USER_TYPES.ADMIN && userId)
        || userInfo.userType === USER_TYPES.USER) {

        const user = userInfo.userType === USER_TYPES.ADMIN ? 
            await usersDB.getItem(userId) : userInfo; 
        
        if (!user) {
            return responseHelper("Error retrieving user information", undefined, HTTP_ERROR_CODES.NOT_FOUND);
        }

        const regUser = classInfo.registeredUsers.find(e => e.id === user.id);
        if(!regUser) {
            return responseHelper(
                "Cannot cancel class because the user is not registered", 
                undefined, 
                HTTP_ERROR_CODES.BAD_REQUEST);
        }
        
        const classDate = new Date(classInfo.date);
        const miliseconds = classDate.getTime() - today.getTime();

        if((miliseconds/1000) > 86400) {
            for(let p of user?.purchasedPackages) {
                const pDate = new Date(p.expireDate)
                if(today < pDate){
                    p.availableClasses += 1;
                    break;
                }
            }
        }

        classInfo.registeredUsers = classInfo.registeredUsers.filter(e => e.id !== user.id);
        const newBookedClasses = user.bookedClasses.filter((c) => c.sk !== classInfo.date);

        await Promise.all([
            usersDB.updateItem(user.id,{
                purchasedPackages: user!.purchasedPackages,
                bookedClasses: newBookedClasses,
            }),
            classesDB.updateItem(classInfo.month,{registeredUsers: classInfo!.registeredUsers}, classInfo.date)
        ])

        return responseHelper('Succesfully canceled class');

    } else {
        await classesDB.updateItem(classInfo.id,{canceled: true})
        const users = await usersDB.batchGetById(classInfo.registeredUsers.map(user => user.id))
        users.forEach(user => {
            for(let p of user.purchasedPackages) {
                const pDate = new Date(p.expireDate)
                if(today < pDate){
                    p.availableClasses += 1;
                    break;
                }
            }
        });

        await Promise.all(users.map(user => usersDB.updateItem(user.id, {purchasedPackages: user.purchasedPackages} )))

        return responseHelper('Succesfully canceled class');
    }
}