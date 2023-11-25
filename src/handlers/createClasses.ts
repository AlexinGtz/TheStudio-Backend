import { CustomDynamoDB } from '../dynamodb/database';
import { HTTP_ERROR_CODES, USER_TYPES, msInADay } from '../constants';
import { validateToken } from '../helpers/validateToken';
import { responseHelper } from '../helpers/responseHelper';

const classesDB = new CustomDynamoDB(process.env.CLASSES_TABLE!, 'month', 'date');

const days = {
    0: [],
    1: [
        6,
        7,
        8,
        9,
        10,
        17,
        18,
        19,
        20,
    ],
    2: [
        7,
        8,
        9,
        10,
        11,
        17,
        18,
        19,
        20,
    ],
    3: [
        6,
        7,
        8,
        9,
        10,
        17,
        18,
        19,
        20,
    ],
    4: [
        7,
        8,
        9,
        10,
        11,
        17,
        18,
        19,
        20,
    ],
    5: [
        6,
        7,
        8,
        9,
        10,
        17,
        18,
        19,
        20,
    ],
    6: [
        8,
        9,
        10,
        11,
    ]
}

export const handler = async (event: any) => {
    const tokenData = await validateToken(event.headers.Authorization);
    if(!tokenData) {
        return responseHelper("Token de usuario no válido", undefined, HTTP_ERROR_CODES.BAD_REQUEST);
    }

    if(tokenData.userType !== USER_TYPES.DEV) {
        return responseHelper('Acción prohivida para el usuario', undefined, HTTP_ERROR_CODES.FORBIDDEN);
    }

    const body = JSON.parse(event.body);

    const { year, month } = body;
    const startDay = new Date(`${year}-${month}-01T00:00:00-06:00`);

    let exit = false;
    const itemsToInsert: any = [];

    do {
        const dayToSchedule = days[startDay.getDay()];

        for (let hour of dayToSchedule) {
            let newDay = new Date(startDay.getTime());
            newDay.setHours(startDay.getHours() + hour);
            itemsToInsert.push({
                month: month,
                date: newDay.toISOString(),
                instructor: "Maria Suarez",
                registeredUsers: [],
                maxUsers: 6,
                cancelled: false
            });
        }

        startDay.setTime(startDay.getTime() + msInADay)
        if ((startDay.getMonth() + 1).toString() !== month) {
            exit = true;
        }
    } while (!exit)
 
    await classesDB.batchWriteItems(itemsToInsert);

    return responseHelper("Clases para el mes creadas exitosamente")
}