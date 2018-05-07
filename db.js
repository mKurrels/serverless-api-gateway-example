"use strict";

const AWS = require("aws-sdk");
const IS_OFFLINE = process.env.IS_OFFLINE;
const NODES_TABLE = process.env.NODES_TABLE;
const PROJECTS_TABLE = process.env.PROJECTS_TABLE;

let dynamoDb;
if (IS_OFFLINE === "true") {
    dynamoDb = new AWS.DynamoDB.DocumentClient({
        region: "localhost",
        endpoint: "http://localhost:8000"
    });
} else {
    dynamoDb = new AWS.DynamoDB.DocumentClient();
}

function getNode(nodeID) {
    const params = {
        TableName: NODES_TABLE,
        Key: {
            nodeId: nodeID
        }
    };
    return dynamoDb.get(params).promise();
}

function addNodes(nodes) {
    let putRequests = [];
    nodes.forEach(node => {
        putRequests.push({
            PutRequest: {
                Item: node
            }
        });
    });
    const params = {
        RequestItems: {
            [NODES_TABLE]: putRequests
        }
    };
    return dynamoDb.batchWrite(params).promise();
}

function getProject(projectName) {
    const params = {
        TableName: PROJECTS_TABLE,
        Key: {
            projectName: projectName
        }
    };
    return dynamoDb.get(params).promise();
}

function putProject(project) {
    const params = {
        TableName: PROJECTS_TABLE,
        Item: project,
        ReturnValues: "ALL_OLD" // we return previous project to check to see if there was one there already
    };
    return dynamoDb.put(params).promise();
}

module.exports = {
    getNode: getNode,
    addNodes: addNodes,
    getProject: getProject,
    putProject: putProject
};
