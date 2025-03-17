import { CustomDynamoDB } from "../dynamodb/database";

const usersDB = new CustomDynamoDB(process.env.USERS_TABLE!, 'phoneNumber');
const forbiddenEmailsDB = new CustomDynamoDB(process.env.FORBIDDEN_EMAILS!, 'email');

export const handler = async (event: any) => {
    event.Records.forEach(async (record: any) => {
        const { email, type } = JSON.parse(record.body);

        const userInfo = await usersDB.query(email, null, null, 'email-index');

        console.log(userInfo);

        await forbiddenEmailsDB.putItem({
            email: email,
            type: type,
            user_phone_number: userInfo[0].phoneNumber,
        });

        if(type === "COMPLAIN") {
            await usersDB.updateItem(userInfo[0].phoneNumber,{complained: true});
        } else if(type === "BOUNCE") {
            await usersDB.updateItem(userInfo[0].phoneNumber,{bounced: true});
        }

        console.log(`Email processed: ${email} - ${type}`);
    });
}
