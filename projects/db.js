"use strict";

const PROJECTS_TABLE = process.env.PROJECTS_TABLE;
const dynamoDb = require("../dbconfig");

function listProjects(lastKey) {
    let params = {
        TableName: PROJECTS_TABLE,
        ConsistentRead: true // otherwise the read may not reflect writes that happen immediately prior to the read
    };

    if (lastKey !== undefined) {
        params.ExclusiveStartKey = lastKey;
    }

    return dynamoDb.scan(params).promise();
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

function updateProject(project) {
    let setExpressions = [];
    let expressionAttributeValues = {};
    for (const key in project) {
        if (key !== "projectName") {
            setExpressions.push(key + " = :" + key);
            expressionAttributeValues[":" + key] = project[key];
        }
    }

    const params = {
        TableName: PROJECTS_TABLE,
        Key: { projectName: project.projectName },
        UpdateExpression: "set " + setExpressions.join(", "),
        ConditionExpression: "attribute_exists(projectName)", //can only update a project, not create a new one
        ExpressionAttributeValues: expressionAttributeValues
    };
    return dynamoDb.update(params).promise();
}

module.exports = {
    updateProject: updateProject,
    listProjects: listProjects,
    getProject: getProject,
    putProject: putProject
};
