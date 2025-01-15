const fs = require('fs');

const classesFile = fs.readFileSync('./src/scripts/classes.json')
const usersFile = fs.readFileSync('./src/scripts/users.json')

const classes = JSON.parse(classesFile)
const users = JSON.parse(usersFile)

const classesTableKey = 'qa-the-studio-classes-v2';
const usersTableKey = 'qa-the-studio-users';

const finalClasses = {
    [classesTableKey]: classes.map((bookedClass) => {
        const dateByType = {
            S: `${bookedClass.date.S}#PILATES`
        };
        delete bookedClass.date;
        
        return {
            "PutRequest": {
               "Item": {
                    ...bookedClass,
                    date_by_type: dateByType
               }
            }
        }
    })
}

const today = new Date();

const finalUsers = {
    [usersTableKey]: users.map((user) => {

        const filteredBookedClasses = user.bookedClasses?.L.filter((bookedClass) => {
            const classDate = new Date(bookedClass.M.sk.S);
            
            return classDate > today;
        });

        const newBookedClasses = filteredBookedClasses?.map((bookedClass) => {        
            const newSecondaryKey = {
                S: `${bookedClass.M.sk.S}#PILATES`
            };
            return {
                M: {
                    ...bookedClass.M,
                    sk: newSecondaryKey
                }
            }
        });        
    
        const newPurchasedPackages = user.purchasedPackages?.L.filter((purchasedPackage) => {
            const expirationDate = new Date(purchasedPackage.M.expireDate.S);
            return expirationDate > today;
        });   
        
        
        return {
            "PutRequest": {
               "Item": {
                    ...user,
                    bookedClasses: newBookedClasses ? { L: newBookedClasses } : {L: []},
                    purchasedPackages: newPurchasedPackages ? { L: newPurchasedPackages } : {L: []}
               }
            }
        }
    }),
}

const batchSize = 25;
const classesFiles = Math.ceil(finalClasses[classesTableKey].length / batchSize);
const userFiles = Math.ceil(finalUsers[usersTableKey].length / batchSize);

for(let i = 0; i < classesFiles; i++) {
    fs.writeFileSync(`./src/scripts/newClasses${i + 1}.json`, JSON.stringify({
        [classesTableKey]: finalClasses[classesTableKey].slice(i * batchSize, (i + 1) * batchSize)
    }))
}

for(let i = 0; i < userFiles; i++) {
    fs.writeFileSync(`./src/scripts/newUsers${i + 1}.json`, JSON.stringify({
        [usersTableKey]: finalUsers[usersTableKey].slice(i * batchSize, (i + 1) * batchSize)
    }))
}

fs.writeFileSync(`./src/scripts/classBatchSizes.txt`, `${classesFiles}\n`);
fs.writeFileSync(`./src/scripts/usersBatchSizes.txt`, `${userFiles}\n`);