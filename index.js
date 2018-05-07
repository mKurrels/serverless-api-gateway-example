"use strict";

const serverless = require("serverless-http");
const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const db = require("./db");

app.use(bodyParser.json({ strict: false }));

// Get Node endpoint
app.get("/nodes/:nodeId", function(req, res) {
    db
        .getNode(req.params.nodeId)
        .then(result => {
            if (result.Item) {
                res.json(result.Item);
            } else {
                res.status(404).json({ error: "Node not found" });
            }
        })
        .catch(error => {
            console.log(error);
            res.status(500).json({ error: error.message });
        });
});

// Create or Update Node(s)

// as you stated that you often have to add many nodes at once, this endpoint expects an array of nodes. But you can
// give it an array of just one node. I decided to combine the create and update endpoints for simplicity, but depending
// on the use case, you may want to have separate endpoints for these.
app.post("/nodes", function(req, res) {
    const nodes = req.body;
    if (!Array.isArray(nodes)) {
        res.status(400).json({ error: "input must be an array of nodes" });
        return;
    }

    // validate that the nodes have the correct properties
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const id = nodes[i].nodeId;
        if (typeof id !== "string") {
            res.status(400).json({ error: "node at index: " + i + " must have an string nodeId property" });
            return;
        } else if (typeof node.latitude !== "number") {
            res.status(400).json({ error: "node at index: " + i + " must have a number 'latitude' property" });
            return;
        } else if (typeof node.longitude !== "number") {
            res.status(400).json({ error: "node at index: " + i + " must have a number 'longitude' property" });
            return;
        } else if (typeof node.shippingStatus !== "string") {
            res.status(400).json({
                error: "node at index: " + i + " must have a string 'shippingStatus' property"
            });
            return;
        } else if (!shippingStatusValid(node.shippingStatus)) {
            res.status(400).json({
                error:
                    "node at index: " +
                    i +
                    " must have a 'shippingStatus' of either 'Pending', 'Shipping', or 'Shipped'"
            });
            return;
        } else if (typeof node.configurationStatus !== "string") {
            res.status(400).json({
                error: "node at index: " + i + " must have a string 'configurationStatus' property"
            });
            return;
        } else if (!configurationStatusValid(node.configurationStatus)) {
            res.status(400).json({
                error:
                    "node at index: " +
                    i +
                    " must have a 'configurationStatus' of either 'Unconfigured', 'Configured', or 'Working'"
            });
            return;
        }
    }

    db
        .addNodes(nodes)
        .then(() => {
            res.status(200).json({ message: "Add/Update successful" });
        })
        .catch(error => {
            console.log(error);
            res.status(500).json({ error: error.message });
        });
});

// Get Project endpoint
app.get("/projects/:projectName", function(req, res) {
    db
        .getProject(req.params.projectName)
        .then(result => {
            if (result.Item) {
                res.json(result.Item);
            } else {
                res.status(404).json({ error: "Project not found" });
            }
        })
        .catch(error => {
            console.log(error);
            res.status(500).json({ error: error.message });
        });
});

// Create or Update a Project endpoint
// Why PUT and not POST like for the nodes? We only add/change one project at a time. And, because I am assuming we
// already know what project name we want to add/change, we can specify that name in the url. When we can specify
// the resource ID, it makes sense to use PUT instead of POST. See this stackoverflow thread:
// https://stackoverflow.com/questions/18470588/in-rest-is-post-or-put-best-suited-for-upsert-operation

// For the Nodes endpoint, we might submit several different nodes, so we cannot specify the node id in the url.
// Hence the POST. I would be willing to be persuaded to do this differently.

app.put("/projects/:projectName", function(req, res) {
    let project = req.body;
    if (project.projectName !== req.params.projectName) {
        res.status(409).json({ error: "'projectName' must match the name given in the url" });
        return;
    }

    // validate the project
    if (typeof project.projectName !== "string") {
        res.status(400).json({ error: "'projectName' must be a string" });
        return;
    } else if (typeof project.customer !== "string") {
        res.status(400).json({ error: "'customer' must be a string" });
        return;
    } else if (typeof project.startDate !== "string") {
        res.status(400).json({ error: "'startDate' must be a string" });
        return;
    } else if (typeof project.endDate !== "string") {
        res.status(400).json({ error: "'endDate' must be a string" });
        return;
    }

    db
        .putProject(project)
        .then(data => {
            // project with projectName already exists
            if (data.Attributes) {
                res.json({ message: "project updated" });
            } else {
                res.status(201).json({ message: "project created" });
            }
        })
        .catch(error => {
            if (error) {
                console.log(error);
                res.status(500).json({ error: error.message });
            }
        });
});

function shippingStatusValid(shippingStatus) {
    const validStatuses = {
        Pending: true,
        Shipping: true,
        Shipped: true
    };
    return shippingStatus in validStatuses;
}

function configurationStatusValid(configurationStatus) {
    const validStatuses = {
        Unconfigured: true,
        Configured: true,
        Working: true
    };
    return configurationStatus in validStatuses;
}

module.exports.handler = serverless(app);
