import { CustomDynamoDB } from "../dynamodb/database";
import { getMonthName } from "../helpers/dateHelper";
import { sendMail } from "../helpers/emailHelper";
import noPurchasesTemplate from "../helpers/emailTemplates/noPurchasesTemplate";
import reportTemplate from "../helpers/emailTemplates/reportTemplate";
import { formatCurrency } from "../helpers/formatHelper";

const packagesDB = new CustomDynamoDB(process.env.PACKAGES_TABLE!, 'id');
const purchasesDB = new CustomDynamoDB(process.env.PURCHASES_TABLE!, 'id', 'purchase_date');

export const handler = async () => {
    console.log("Started sending report");
    const packageInfo = await packagesDB.scan();

    const lastWeek = new Date();
    const today = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    lastWeek.setHours(19, 0, 0, 0);

    const purchasePromises = packageInfo.items.map(async (packageItem: any) => purchasesDB.query(packageItem.id, lastWeek.toISOString(), ">", "package_id-index"));
    const purchaseInfo = await Promise.all(purchasePromises);

    if(purchaseInfo.length === 0) {
        console.log(`No purchases found in the last week - ${lastWeek.toISOString()} - ${today.toISOString()}`);
        await sendMail(noPurchasesTemplate());
        return;
    }

    let totalIndividualRows = "";
    let userRows = "";
    const totals = {
        totalPurchases: 0,
        totalIncome: 0,
    };

    purchaseInfo.forEach((packageGroup: any) => {
        if(packageGroup.length === 0) {
            return;
        }
        
        const relatedPackage = packageInfo.items.find((item: any) => item.id === packageGroup[0].package_id);

        const individualTotals = {
            totalPurchases: 0,
            totalIncome: 0,
        };

        const classType = relatedPackage.classType === "COMBINED" ? "COMBINADO" : relatedPackage.classType;

        packageGroup.forEach((purchaseItem: any) => {
            userRows += `<tr style='border: 1px solid #000; text-align: center;'><td style='border: 1px solid #000;'>${purchaseItem.user_name}</td><td style='border: 1px solid #000;'>${classType} ${relatedPackage.classQuantity} clases</td><td style='border: 1px solid #000;'>${new Date(purchaseItem.purchase_date).toLocaleDateString()}</td><td style='border: 1px solid #000;'>${formatCurrency(purchaseItem.price)}</td></tr>`;
            individualTotals.totalPurchases += 1;
            individualTotals.totalIncome += purchaseItem.price;
        });
        
        totalIndividualRows += `<tr style='border: 1px solid #000; text-align: center;'><td style='border: 1px solid #000;'>${classType}</td><td style='border: 1px solid #000;'>${relatedPackage.classQuantity}</td><td style='border: 1px solid #000;'>${formatCurrency(relatedPackage.cost)}</td><td style='border: 1px solid #000;'>${individualTotals.totalPurchases}</td><td style='border: 1px solid #000;'>${formatCurrency(individualTotals.totalIncome)}</td></tr>`;
        totals.totalPurchases += packageGroup.length;
        totals.totalIncome += relatedPackage.cost * packageGroup.length;
    });

    const totalsRow = `<tr style='border: 1px solid #000; text-align: center;'><td style='border: 1px solid #000;'>TOTALES</td><td style='border: 1px solid #000;'></td><td style='border: 1px solid #000;'></td><td style='border: 1px solid #000;'>${totals.totalPurchases}</td><td style='border: 1px solid #000;'>${formatCurrency(totals.totalIncome)}</td></tr>`;
    const userTotalsRows = `<tr style='border: 1px solid #000; text-align: center;'><td style='border: 1px solid #000;'>TOTALES</td><td style='border: 1px solid #000;'></td><td style='border: 1px solid #000;'></td><td style='border: 1px solid #000;'>${formatCurrency(totals.totalIncome)}</td></tr>`;
    try {
        await sendMail(reportTemplate({
            totalsIndividualRows: totalIndividualRows,
            totalsRow: totalsRow,
            userTotalsRows: userTotalsRows,
            userRows: userRows,
            dateRange: {
            startDay: lastWeek.getDate().toString(),
            startMonth: getMonthName(lastWeek.getMonth()),
            endDay: today.getDate().toString(),
            endMonth: getMonthName(today.getMonth()),
                year: lastWeek.getFullYear().toString(),
            }
        }));
        console.log(`Report sent - ${today.toISOString()}`);
    } catch (error) {
        console.error(`Error sending report - ${today.toISOString()}`);
        console.error(`OBJECT: ${JSON.stringify(purchaseInfo)}`);
        console.error(error);
    }
}

