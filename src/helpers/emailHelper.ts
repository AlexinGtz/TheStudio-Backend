import * as nodemailer from "nodemailer";
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2'

const sesClient = new SESv2Client({
    region: 'us-east-2',
});
  
const transporter = nodemailer.createTransport({
    SES: { sesClient, SendEmailCommand }
});

export const sendMail = async (template: any) => {
    const info = await transporter.sendMail(template);

    console.log("Email sent: %s", info.messageId);
    return info;
}