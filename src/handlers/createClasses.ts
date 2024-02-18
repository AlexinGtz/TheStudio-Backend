import { CustomDynamoDB } from '../dynamodb/database';
import { HTTP_ERROR_CODES, USER_TYPES, msInADay } from '../constants';
import { validateToken } from '../helpers/validateToken';
import { responseHelper } from '../helpers/responseHelper';

const classesDB = new CustomDynamoDB(process.env.CLASSES_TABLE!, 'month', 'date');

const days = {
    0: [],
    1: [
        {
            time: 6,
            teacher: ''
        },
        {
            time: 7,
            teacher: ''
        },
        {
            time: 8,
            teacher: ''
        },
        {
            time: 9,
            teacher: ''
        },
        {
            time: 10,
            teacher: ''
        },
        {
            time: 17,
            teacher: ''
        },
        {
            time: 18,
            teacher: ''
        },
        {
            time: 19,
            teacher: ''
        },
    ],
    2: [
        {
            time: 6,
            teacher: ''
        },
        {
            time: 7,
            teacher: ''
        },
        {
            time: 8,
            teacher: ''
        },
        {
            time: 9,
            teacher: ''
        },
        {
            time: 10,
            teacher: ''
        },
        {
            time: 17,
            teacher: ''
        },
        {
            time: 18,
            teacher: ''
        },
        {
            time: 19,
            teacher: ''
        },
    ],
    3: [
        {
            time: 6,
            teacher: ''
        },
        {
            time: 7,
            teacher: ''
        },
        {
            time: 8,
            teacher: ''
        },
        {
            time: 9,
            teacher: ''
        },
        {
            time: 10,
            teacher: ''
        },
        {
            time: 17,
            teacher: ''
        },
        {
            time: 18,
            teacher: ''
        },
        {
            time: 19,
            teacher: ''
        },
    ],
    4: [
        {
            time: 6,
            teacher: ''
        },
        {
            time: 7,
            teacher: ''
        },
        {
            time: 8,
            teacher: ''
        },
        {
            time: 9,
            teacher: ''
        },
        {
            time: 10,
            teacher: ''
        },
        {
            time: 17,
            teacher: ''
        },
        {
            time: 18,
            teacher: ''
        },
        {
            time: 19,
            teacher: ''
        },
    ],
    5: [
        {
            time: 6,
            teacher: ''
        },
        {
            time: 7,
            teacher: ''
        },
        {
            time: 8,
            teacher: ''
        },
        {
            time: 9,
            teacher: ''
        },
        {
            time: 10,
            teacher: ''
        },
        {
            time: 17,
            teacher: ''
        },
        {
            time: 18,
            teacher: ''
        },
        {
            time: 19,
            teacher: ''
        },
    ],
    6: [
        {
            time: 8,
            teacher: ''
        },
        {
            time: 9,
            teacher: ''
        },
        {
            time: 10,
            teacher: ''
        },
        {
            time: 11,
            teacher: ''
        },
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

        for (let obj of dayToSchedule) {
            let newDay = new Date(startDay.getTime());
            newDay.setHours(startDay.getHours() + obj.time);
            itemsToInsert.push({
                month: parseInt(month).toString(),
                date: newDay.toISOString(),
                instructor: obj.teacher,
                registeredUsers: [],
                maxUsers: 6,
                cancelled: false
            });
        }

        startDay.setTime(startDay.getTime() + msInADay)
        if (startDay.getMonth() + 1 !== parseInt(month)) {
            exit = true;
        }
    } while (!exit)
 
    await classesDB.batchWriteItems(itemsToInsert);

    return responseHelper("Clases para el mes creadas exitosamente")
}