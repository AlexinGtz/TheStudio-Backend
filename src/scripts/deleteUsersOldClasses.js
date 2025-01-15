const fs = require('fs');

const usersFile = fs.readFileSync('./src/scripts/users.json')

const users = JSON.parse(usersFile)

const today = new Date();

const finalUsers = users.map((user) => {
    const newPurchasedPackages = user.purchasedPackages?.L.filter((purchasedPackage) => {
        const expirationDate = new Date(purchasedPackage.M.expireDate.S);
        return expirationDate > today;
    });    
    const filteredBookedClasses = user.bookedClasses?.L.filter((bookedClass) => {
        const classDate = new Date(bookedClass.M.sk.S.split('#')[0]);
        return classDate > today;
    });
    return {
        "PutRequest": {
           "Item": {
                ...user,
                purchasedPackages: newPurchasedPackages ? { L: newPurchasedPackages } : {L: []},
                bookedClasses: filteredBookedClasses ? { L: filteredBookedClasses } : {L: []}
           }
        }
    }
});

fs.writeFileSync('./src/scripts/newUsers.json', JSON.stringify(finalUsers))