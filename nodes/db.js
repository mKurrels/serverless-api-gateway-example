"use strict";

const NODES_TABLE = process.env.NODES_TABLE;
const dynamoDb = require("../dbconfig");

function listNodes(projectName, lastKey) {
    let params = {
        TableName: NODES_TABLE,
        ConsistentRead: true // otherwise the read may not reflect writes that happen immediately prior to the read
    };

    if (projectName !== undefined) {
        params.FilterExpression = "projectName = :projectName";
        params.ExpressionAttributeValues = { ":projectName": projectName };
    }

    if (lastKey !== undefined) {
        params.ExclusiveStartKey = lastKey;
    }

    return dynamoDb.scan(params).promise();
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

function updateNode(node, shouldRemoveProjectName) {
    let setExpressions = [];
    let expressionAttributeValues = {};
    for (const key in node) {
        if (key !== "nodeId") {
            setExpressions.push(key + " = :" + key);
            expressionAttributeValues[":" + key] = node[key];
        }
    }

    const params = {
        TableName: NODES_TABLE,
        Key: { nodeId: node.nodeId },
        UpdateExpression: "",
        ConditionExpression: "attribute_exists(nodeId)" //can only update a node, not create a new one
    };

    if (setExpressions.length > 0) {
        params.UpdateExpression = "set " + setExpressions.join(", ");
        params.ExpressionAttributeValues = expressionAttributeValues;
    }
    if (shouldRemoveProjectName) {
        params.UpdateExpression += " REMOVE projectName";
    }
    return dynamoDb.update(params).promise();
}

module.exports = {
    updateNode: updateNode,
    listNodes: listNodes,
    getNode: getNode,
    addNodes: addNodes
};
