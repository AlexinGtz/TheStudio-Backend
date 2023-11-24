import * as nodemailer from "nodemailer";
import * as aws from '@aws-sdk/client-ses'

const ses = new aws.SES({
    apiVersion: "2010-12-01",
    region: 'us-east-2',
});
  
const transporter = nodemailer.createTransport({
SES: { ses, aws }
});

export const sendMail = async (template: any) => {
    // send mail with defined transport object
    const info = await transporter.sendMail(template);

    console.log("Email sent: %s", info.messageId);
    return info;
}