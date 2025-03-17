import { BatchGetItemCommand, BatchWriteItemCommand, DeleteItemCommand, DynamoDBClient, GetItemCommand, PutItemCommand, QueryCommand, ScanCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

export class CustomDynamoDB {
    private tableName: string;
    private primaryKey: string;
    sortingKey;
    DB;

    constructor(tableName: string, primaryKey: string, sortingKey?: string) {
        this.tableName = tableName;
        this.primaryKey = primaryKey;
        this.DB = new DynamoDBClient({
            endpoint: process.env.STAGE === 'local' ? "http://localhost:4000" : undefined,
        });
        this.sortingKey = sortingKey ?? null;
    }

    async getItem(primaryKeyValue, secondaryKeyValue?) {
        const pk: any = marshall({[this.primaryKey]: primaryKeyValue});
        let sk;
        if (secondaryKeyValue) {
            sk = marshall({[this.sortingKey]: secondaryKeyValue})
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

    async query(id, secondaryKeyVal?, sortComparison?, indexName?) {
        const pkName = `#${indexName?.split('-')[0] ?? this.primaryKey}`
        const skName = `#${this.sortingKey}`

        let condition = `${pkName} = :pk`

        const expressionValues = {
            ":pk": {
                S: id
            },
        }

        const expressionNames = {
            [pkName]: indexName?.split('-')[0] ?? this.primaryKey,
        }

        if (this.sortingKey && secondaryKeyVal) {
            expressionValues[":sk"] = {
                S: secondaryKeyVal
            }
            expressionNames[skName] = this.sortingKey;
            condition = condition.concat(` AND ${skName} ${sortComparison} :sk`);
        }

        const options = new QueryCommand({
            TableName: this.tableName,
            IndexName: indexName ?? undefined,
            KeyConditionExpression: condition,
            ExpressionAttributeValues: expressionValues,
            ExpressionAttributeNames: expressionNames,
        });

        const dbRes = await this.DB.send(options);

        return (dbRes.Items.map(e => unmarshall(e)));
    }

    async putItem(item) {
        const options = new PutItemCommand({
            TableName: this.tableName,
            Item: marshall(item),
        })
        return this.DB.send(options);
    }

    async scan(limit?: number, lastKey?: string) { 
        const options = new ScanCommand({
            TableName: this.tableName,
            Limit: limit ?? undefined,
            ExclusiveStartKey: lastKey ? marshall({[this.primaryKey]: lastKey}) : undefined,
        });

        const dbRes = await this.DB.send(options)
        const unmarshalledItems = dbRes.Items.map(e => unmarshall(e));
        const lastEvaluatedKey = dbRes.LastEvaluatedKey;
        return ({
            items: unmarshalledItems,
            lastEvaluatedKey
        });
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
            ReturnValues: 'NONE',
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

    async deleteItem(pk, sk?) {
        const options = new DeleteItemCommand({
            TableName: this.tableName,
            Key: {
                [this.primaryKey]: {
                    S: pk
                },
                ...(sk ? {
                    [this.sortingKey]: {
                        S: sk
                    }
                } : {})
            }
        });


        return this.DB.send(options);
    }
}