import { BatchGetItemCommand, BatchWriteItemCommand, DynamoDBClient, GetItemCommand, PutItemCommand, QueryCommand, ScanCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

export class CustomDynamoDB {
    tableName;
    primaryKey;
    sortingKey;
    DB;

    constructor(tableName: string, primaryKey: string, sortingKey?: string) {
        this.tableName = tableName;
        this.primaryKey = primaryKey;
        this.DB = new DynamoDBClient({
            endpoint: "http://localhost:4000"
        });
        this.sortingKey = sortingKey ?? null;
    }

    async getItem(primaryKey, secondaryKey?) {
        const pk: any = marshall({[this.primaryKey]: primaryKey});
        let sk;
        if (secondaryKey) {
            sk = marshall({[this.sortingKey]: secondaryKey})
        }

        const options = new GetItemCommand({
            TableName: this.tableName,
            Key: {
                ...pk,
                ...sk
            }
        })

        const dbRes = await this.DB.send(options);
        if(!dbRes.Item) {
            return null;
        }
        return unmarshall(dbRes.Item);
    }

    async getByPrimaryKey(id, identifier, indexName, attributes){
        const options = new QueryCommand({
            KeyConditionExpression: `${identifier ?? this.primaryKey} = :id`,
            ExpressionAttributeValues: {
                ":id": {
                    S: id,
                }
            },
            TableName: this.tableName,
            IndexName: indexName ?? null,
            Select: attributes ? 'SPECIFIC_ATTRIBUTES' : 'ALL_ATTRIBUTES',
            ProjectionExpression: attributes ? 
                attributes.join(',')
                : null,
        })
        const dbRes = await this.DB.send(options);
        if(!dbRes.Items.length) {
            return null;
        }
        return unmarshall(dbRes.Items[0]);
    }

    async getByIndex(
        indexName,
        pKeyName,
        pKeyValue,
        sortKeyName?,
        sortKeyValue?,
        sortComparison?){
        const options = new QueryCommand({
            KeyConditionExpression: `${pKeyName} = :value`,
            ExpressionAttributeValues: {
                ":value": {
                    S: pKeyValue,
                }
            },
            TableName: this.tableName,
            IndexName: indexName,
        })

        const dbRes = await this.DB.send(options);
        if(!dbRes.Items.length) {
            return null;
        }
        return unmarshall(dbRes.Items[0]);
    }

    async query(id, secondaryKeyVal?, sortComparison?, indexName?) {
        const pkName = `#${this.primaryKey}`
        const skName = `#${this.sortingKey}`

        let condition = `${pkName} = :pk`
        if (this.sortingKey) {
            condition = condition.concat(` AND ${skName} ${sortComparison} :sk`);
        }

        const options = new QueryCommand({
            TableName: this.tableName,
            IndexName: indexName ?? undefined,
            KeyConditionExpression: condition,
            ExpressionAttributeValues: {
                ":pk": {
                    S: id
                },
                ":sk": {
                    S: secondaryKeyVal
                }
            },
            ExpressionAttributeNames: {
                [pkName]: this.primaryKey,
                [skName]: this.sortingKey
            }
        })

        const dbRes = await this.DB.send(options)

        return (dbRes.Items.map(e => unmarshall(e)));
    }

    async putItem(item) {
        const options = new PutItemCommand({
            TableName: this.tableName,
            Item: marshall(item),
        })
        return this.DB.send(options);
    }

    async scan() { 
        const options = new ScanCommand({
            TableName: this.tableName,
        });

        const dbRes = await this.DB.send(options)

        return (dbRes.Items.map(e => unmarshall(e)));
    }

    async updateItem(pk, item, sk?) {
        let updateExp = '';
        let expValues: Array<any> = [];

        for (let [k, v] of Object.entries(item)) {
            updateExp = `${updateExp} ${k} = :${k},`;
            expValues.push(marshall({ [`:${k}`]: v }));
            
        }

        const ExpressionAttributeValues = {};

        for (const obj of expValues) {
            const keys = Object.keys(obj)
            ExpressionAttributeValues[keys[0]] = obj[`${keys[0]}`]
        }

        let key = {
            [this.primaryKey]: {
                S: pk
            }
        }

        if(this.sortingKey) {
            key[this.sortingKey] = {
                S: sk
            }
        }

        const options = new UpdateItemCommand({
            TableName: this.tableName,
            UpdateExpression: `SET ${updateExp.slice(0, updateExp.length - 1)}`,
            ExpressionAttributeValues,
            Key: key,
            ReturnValues: 'NONE'
        });

        await this.DB.send(options);
    }

    async batchGetById(idArray) {
        const options = new BatchGetItemCommand({
            RequestItems: {
                [this.tableName]: {
                    Keys: idArray.map(el => {
                        const key = {[this.primaryKey]: { S: el.pk }}
                        if(this.sortingKey) {
                            key[this.sortingKey]= { S: el.sk }
                        }

                        return key;
                    })
                }
            }
        })

        const dbRes = await this.DB.send(options);

        return (dbRes.Responses[this.tableName].map(e => unmarshall(e)));

    } 

    async batchWriteItems(items) {
        const batchSize = 25;
        const numberOfCalls = Math.ceil(items.length / batchSize);
        const callsToDB: any = []

        for(let i = 0; i < numberOfCalls; i++) {
            const currentItems = items.slice(i * batchSize, (i + 1) * batchSize);
            const options = new BatchWriteItemCommand({
                RequestItems: {
                    [this.tableName]: currentItems.map((it) => ({
                        PutRequest: {
                            Item: marshall(it)
                        }
                    }))
                }
            });

            callsToDB.push(this.DB.send(options))
        }

        return Promise.all(callsToDB);
    }

    static marshall(item) {
        return marshall(item);
    }

    static unmarshall(item) {
        return unmarshall(item);
    }
}