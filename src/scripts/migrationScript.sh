#!/bin/sh

#aws dynamodb scan --table-name prod-the-studio-classes --output json --query "Items[*]" > ./src/scripts/classes.json
aws dynamodb scan --table-name prod-the-studio-users --output json --query "Items[*]" > ./src/scripts/users.json

node ./src/scripts/migrateClasses.js

#sizeClasses=$(<./src/scripts/classBatchSizes.txt)
sizeUsers=$(<./src/scripts/usersBatchSizes.txt)

# for i in $(seq 1 $sizeClasses)
# do
#     echo "Batch Classes $i"
#     aws dynamodb batch-write-item --request-items file://./src/scripts/newClasses$i.json
#     rm ./src/scripts/newClasses$i.json
# done
for i in $(seq 1 $sizeUsers)
do
    echo "Batch Users $i"
    aws dynamodb batch-write-item --request-items file://./src/scripts/newUsers$i.json
    rm ./src/scripts/newUsers$i.json
done

echo Done