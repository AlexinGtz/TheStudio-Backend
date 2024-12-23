const fs = require('fs');

const classesFile = fs.readFileSync('./src/scripts/classes.json')

const classes = JSON.parse(classesFile)

const finalClasses = classes.Items.map((bookedClass) => {
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
});

fs.writeFileSync('./src/scripts/newClasses.json', JSON.stringify(finalClasses))