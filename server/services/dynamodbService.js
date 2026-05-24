const docClient = require('../config/dynamodb');
const { GetCommand, PutCommand, ScanCommand, DeleteCommand, UpdateCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const TABLE_PREFIX = ''; // Optional prefix for tables

const getTableName = (name) => `${TABLE_PREFIX}${name}`;

const dynamoService = {
    async get(tableName, key) {
        const command = new GetCommand({
            TableName: getTableName(tableName),
            Key: key
        });
        const response = await docClient.send(command);
        return response.Item;
    },

    async put(tableName, item) {
        const command = new PutCommand({
            TableName: getTableName(tableName),
            Item: item
        });
        await docClient.send(command);
        return item;
    },

    async delete(tableName, key) {
        const command = new DeleteCommand({
            TableName: getTableName(tableName),
            Key: key
        });
        await docClient.send(command);
        return true;
    },

    async scan(tableName, filterExpression = null, expressionAttributeValues = null, expressionAttributeNames = null) {
        const params = {
            TableName: getTableName(tableName)
        };
        if (filterExpression) params.FilterExpression = filterExpression;
        if (expressionAttributeValues) params.ExpressionAttributeValues = expressionAttributeValues;
        if (expressionAttributeNames) params.ExpressionAttributeNames = expressionAttributeNames;
        
        const command = new ScanCommand(params);
        const response = await docClient.send(command);
        return response.Items || [];
    },

    async query(tableName, keyConditionExpression, expressionAttributeValues, expressionAttributeNames = null) {
        const params = {
            TableName: getTableName(tableName),
            KeyConditionExpression: keyConditionExpression,
            ExpressionAttributeValues: expressionAttributeValues
        };
        if (expressionAttributeNames) params.ExpressionAttributeNames = expressionAttributeNames;

        const command = new QueryCommand(params);
        const response = await docClient.send(command);
        return response.Items || [];
    },

    async update(tableName, key, updateExpression, expressionAttributeValues, expressionAttributeNames = null) {
        const params = {
            TableName: getTableName(tableName),
            Key: key,
            UpdateExpression: updateExpression,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW'
        };
        if (expressionAttributeNames) params.ExpressionAttributeNames = expressionAttributeNames;

        const command = new UpdateCommand(params);
        const response = await docClient.send(command);
        return response.Attributes;
    }
};

module.exports = dynamoService;
