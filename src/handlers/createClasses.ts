import { CustomDynamoDB } from '../dynamodb/database';
import { msInADay } from '../constants';

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
    const body = JSON.parse(event.body);

    const { year, month } = body;
    const startDay = new Date(`${year}-${month}-01T00:00:00-06:00`);

    let exit = false;
    const itemsToInsert: any = [];

    do {
        const dayToSchedule = days[startDay.getDay()];

        for (let hour of dayToSchedule) {
            let newDay = new Date(startDay.getTime());
            newDay.setHours(hour);
            itemsToInsert.push({
                month: month,
                date: newDay.toISOString(),
                instructor: "Maria",
                registeredUsers: [],
                maxUsers: 6,
                canceled: false
            });
        }

        startDay.setTime(startDay.getTime() + msInADay)
        if ((startDay.getMonth() + 1).toString() !== month) {
            exit = true;
        }
    } while (!exit)
 
    await classesDB.batchWriteItems(itemsToInsert);

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: "Succesfully created classes for the month"
        })
    }
}