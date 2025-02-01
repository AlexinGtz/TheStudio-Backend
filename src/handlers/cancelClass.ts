import { HTTP_ERROR_CODES, USER_TYPES } from "../constants";
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

    const today = new Date();

    const { classDateByType, userId, classMonth } = JSON.parse(event.body);

    const [userInfo, classInfo] = await Promise.all([
        usersDB.getItem(tokenData.phoneNumber),
        classesDB.getItem(classMonth, classDateByType),
    ]);

    if(!userInfo || !classInfo) {
        return responseHelper("Error buscando los datos en la BD", undefined, HTTP_ERROR_CODES.NOT_FOUND);
    }

    if(classInfo.cancelled) {
        return responseHelper("La clase ya ha sido cancelada", undefined, HTTP_ERROR_CODES.BAD_REQUEST);
    }

    const classType = classInfo.date_by_type.split('#')[1];

    if( (userInfo.userType === USER_TYPES.ADMIN && userId)
        || userInfo.userType === USER_TYPES.USER) {

        const user = userInfo.userType === USER_TYPES.ADMIN ? 
            await usersDB.getItem(userId) : userInfo; 
        
        if (!user) {
            return responseHelper("Error trayendo los datos del usuario de la BD", undefined, HTTP_ERROR_CODES.NOT_FOUND);
        }

        const regUser = classInfo.registeredUsers.find(e => e.phoneNumber === user.phoneNumber);
        if(!regUser) {
            return responseHelper(
                "No se puede cancelar la clase porque el usuario no está registrado", 
                undefined, 
                HTTP_ERROR_CODES.BAD_REQUEST);
        }
        
        const classDate = new Date(classInfo.date_by_type.split('#')[0]);
        const timeDifferenceInMS = classDate.getTime() - today.getTime();

        if((timeDifferenceInMS/1000) > 43200) {
            for(let p of user?.purchasedPackages) {
                const pDate = new Date(p.expireDate)
                if(today < pDate && p.type === classType){
                    p.availableClasses += 1;
                    break;
                }
            }
        }

        classInfo.registeredUsers = classInfo.registeredUsers.filter(e => e.phoneNumber !== user.phoneNumber);
        const newBookedClasses = user.bookedClasses.filter((c) => c.sk !== classInfo.date_by_type);

        await Promise.all([
            usersDB.updateItem(user.phoneNumber,{
                purchasedPackages: user!.purchasedPackages,
                bookedClasses: newBookedClasses,
            }),
            classesDB.updateItem(classInfo.month,{registeredUsers: classInfo!.registeredUsers}, classInfo.date_by_type)
        ])

        return responseHelper('Clase cancelada satisfactoriamente');

    } else {
        await classesDB.updateItem(classInfo.month,{cancelled: true}, classInfo.date_by_type)
        if(classInfo.registeredUsers.length === 0) return responseHelper('Clase cancelada satisfactoriamente');
        const users = await usersDB.batchGetById(classInfo.registeredUsers.map(user => ({
            pk: user.phoneNumber
        })));
        users.forEach(user => {
            for(let p of user.purchasedPackages) {
                const pDate = new Date(p.expireDate)
                if(today < pDate && p.type === classType){
                    p.availableClasses += 1;
                    break;
                }
            }
        });

        await Promise.all(users.map(user => usersDB.updateItem(user.phoneNumber, {purchasedPackages: user.purchasedPackages} )))

        return responseHelper('Clase cancelada satisfactoriamente');
    }
}