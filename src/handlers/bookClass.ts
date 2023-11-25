import { CustomDynamoDB } from "../dynamodb/database";
import { validateToken } from "../helpers/validateToken"
import { HTTP_ERROR_CODES, USER_TYPES } from "../constants";
import { responseHelper } from "../helpers/responseHelper";
import { selectEarliestPackage } from "../helpers/packageHelper";

const classesDB = new CustomDynamoDB(process.env.CLASSES_TABLE!, 'month', 'date');
const usersDB = new CustomDynamoDB(process.env.USERS_TABLE!, 'phoneNumber');

export const handler = async (event: any) => {
    const tokenData = await validateToken(event.headers.Authorization);
    if(!tokenData) {
        return responseHelper("Token de Usuario no válido", undefined, HTTP_ERROR_CODES.BAD_REQUEST);
    }

    const { classDate, users } = JSON.parse(event.body);

    const today = new Date();

    if(!classDate) {
        return responseHelper("No se mando la fecha de la clase", undefined, HTTP_ERROR_CODES.BAD_REQUEST);
    }

    if(classDate < today.toISOString()) {
        return responseHelper("No se puede reservar una clase pasada", undefined, HTTP_ERROR_CODES.BAD_REQUEST);
    }

    const userInfo = await usersDB.getItem(tokenData.phoneNumber);

    if(!userInfo) {
        return responseHelper("Error buscando los datos del usuario", undefined, HTTP_ERROR_CODES.NOT_FOUND);
    }

    if(userInfo.userType === USER_TYPES.ADMIN && !users) {
        return responseHelper("No se mando la lista de usuarios", undefined, HTTP_ERROR_CODES.BAD_REQUEST);
    }

    const usersToBook = userInfo.userType === USER_TYPES.ADMIN ? [...users] : [userInfo.phoneNumber];

    const usersData = await Promise.all(usersToBook.map(u => usersDB.getItem(u)));
    const classDateObj = new Date(classDate);

    const usersWithoutClassBooked = usersData.filter(u => {
        if(!u) return false;
        const classBooked = u.bookedClasses.some(c => c.sk === classDate);
        return !classBooked;
    });

    if(usersWithoutClassBooked.length === 0) {
        return responseHelper("Esta clase ya esta reservada", undefined, HTTP_ERROR_CODES.BAD_REQUEST);
    }

    const classInfo = await classesDB.getItem((classDateObj.getMonth() + 1).toString(), classDate);
    
    if(!classInfo) {
        return responseHelper("La clase seleccionada no existe", undefined, HTTP_ERROR_CODES.NOT_FOUND);
    }

    const availableSlots = classInfo.maxUsers - classInfo.registeredUsers.length;

    if(classInfo.cancelled || availableSlots === 0) {
        return responseHelper("La clase esta llena o ha sido cancelada", undefined, HTTP_ERROR_CODES.BAD_REQUEST);
    }

    if(availableSlots < usersWithoutClassBooked.length) {
        return responseHelper("No hay suficientes lugares para reservar", undefined, HTTP_ERROR_CODES.BAD_REQUEST);
    }

    const userUpdateRequests: Array<any> = [];
    let updatedUsersCount = 0;
 
    usersWithoutClassBooked.forEach((u) => {
        if(!u) return;
        const selectedPackage = selectEarliestPackage(u.purchasedPackages);

        if(!selectedPackage || selectedPackage.availableClasses <= 0) {
            return;
        }
    
        classInfo.registeredUsers.push({
            phoneNumber: u.phoneNumber,
            firstName: u.firstName,
            lastName: u.lastName
        });
    
        selectedPackage.availableClasses = selectedPackage.availableClasses - 1;
        u.bookedClasses.push({pk: classInfo.month, sk: classInfo.date});
        updatedUsersCount++;
        userUpdateRequests.push(usersDB.updateItem(u.phoneNumber,
        {
            purchasedPackages: u.purchasedPackages,
            bookedClasses: u.bookedClasses
        }));
    });

    if(updatedUsersCount === 0) {
        return responseHelper("No se reservó para ningún usuario, clase ya agendada o no tienen clases a favor", undefined, HTTP_ERROR_CODES.BAD_REQUEST);
    }

    await Promise.all([
        userUpdateRequests,
        classesDB.updateItem(classInfo.month,{registeredUsers: classInfo!.registeredUsers}, classInfo.date)
    ])

    return responseHelper("Clase agendada exitosamente");
}