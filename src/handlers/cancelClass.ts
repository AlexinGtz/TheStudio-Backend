import { HTTP_ERROR_CODES, USER_TYPES } from "../constants";
import { CustomDynamoDB } from "../dynamodb/database";
import { validateToken } from "../helpers/validateToken";

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

    const body= JSON.parse(event.body);
    const today = new Date();

    const { classId, userId } = body;


    const [userInfo, classInfo] = await Promise.all([
        usersDB.getItem(tokenData.id),
        classesDB.getItem(classId)
    ]);

    if(!userInfo || !classInfo) {
        return {
            statusCode: HTTP_ERROR_CODES.NOT_FOUND,
            body: JSON.stringify({
                message: "Error retrieving user or class information"
            })
        }
    }

    if(classInfo.canceled) {
        return {
            statusCode: HTTP_ERROR_CODES.BAD_REQUEST,
            body: JSON.stringify({
                message: "Class already canceled"
            })
        }
    }

    if( (userInfo.userType === USER_TYPES.ADMIN && userId)
        || userInfo.userType === USER_TYPES.USER) {

        const user = userInfo.userType === USER_TYPES.ADMIN ? 
            await usersDB.getItem(userId) : userInfo; 
        
        if (!user) {
            return {
                statusCode: HTTP_ERROR_CODES.NOT_FOUND,
                body: JSON.stringify({
                    message: "Error retrieving user information"
                })
            }
        }

        const regUser = classInfo.registeredUsers.find(e => e.id === user.id);
        if(!regUser) {
            return {
                statusCode: HTTP_ERROR_CODES.BAD_REQUEST,
                body: JSON.stringify({
                    message: 'Cannot cancel class because the user is not registered'
                })
            }
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

        await Promise.all([
            usersDB.updateItem(user.id,{purchasedPackages: user!.purchasedPackages}),
            classesDB.updateItem(classInfo.id,{registeredUsers: classInfo!.registeredUsers})
        ])

        return {
            statusCode: 200, 
            body: JSON.stringify({
                message: 'Succesfully canceled class'
            })
        }

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

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Succesfully canceled class"
            })
        }
    }
}