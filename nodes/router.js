const express = require("express");
const router = express.Router();
const Node = require("./db");
const Project = require("../projects/db");

// List all nodes endpoint (with optional projectName filter)
router.get("", function(req, res) {
    const projectName = req.query.projectName;

    let nodes = [];
    Node.listNodes(projectName)
        .then(onScan)
        .catch(sendError);

    function onScan(result) {
        nodes = nodes.concat(result.Items);
        if (result.LastEvaluatedKey) {
            Node.listNodes(projectName, result.LastEvaluatedKey)
                .then(onScan)
                .catch(sendError);
        } else {
            res.json(nodes);
        }
    }

    function sendError(error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});

// Get Node endpoint
router.get("/:nodeId", function(req, res) {
    Node.getNode(req.params.nodeId)
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

// Here I decided to combine the create and update endpoints for simplicity, but depending
// on the use case, you may want to have separate endpoints for these.
router.post("", function(req, res) {
    const nodes = req.body;

    let undefinedAttributesOK = false;
    const err = validateNodes(nodes, undefinedAttributesOK);
    if (err) {
        res.status(400).json({ error: err });
        return;
    }

    checkProjectNamesExist(nodes)
        .then(addAllNodes)
        .catch(error => {
            console.log(error);
            if (error.badProjectNames) {
                res.status(404).json(error);
            } else {
                res.status(500).json({ error: error.message });
            }
        });

    // we must batch our putNode requests as dynamodb only allows for 25 at a time.
    let batch = [];
    let nodeIndex = 0;

    function addAllNodes() {
        batch = [];
        for (let i = 0; i < 25 && nodeIndex < nodes.length; i++) {
            batch.push(nodes[nodeIndex]);
            nodeIndex++;
        }
        if (batch.length === 0) {
            res.status(200).json({ message: "Add/Update successful" });
        } else {
            if (batch.length === 1) {
                console.log("batch thing: ", batch);
            }
            return Node.addNodes(batch).then(addAllNodes);
        }
    }
});

// Update node endpoint
router.patch("/:nodeId", function(req, res) {
    const node = req.body.node;
    const shouldRemoveProjectName = req.body.shouldRemoveProjectName;

    if (node.nodeId !== req.params.nodeId) {
        res.status(409).json({ error: "'nodeId' must match the nodeId given in the url" });
        return;
    }

    let undefinedAttributesOK = true;
    const err = validateNodes([node], undefinedAttributesOK);
    if (err) {
        res.status(400).json({ error: err });
        return;
    }

    checkProjectNamesExist([node])
        .then(() => {
            return Node.updateNode(node, shouldRemoveProjectName);
        })
        .then(() => {
            res.status(204).send(); // no body on successful patch request
        })
        .catch(error => {
            console.log(error);

            if (error.badProjectNames) {
                res.status(404).json(error);
            } else if (error.code === "ConditionalCheckFailedException") {
                res.status(404).json({ error: "node with id '" + node.nodeId + "' not found" });
            } else {
                res.status(500).json({ error: error.message });
            }
        });
});

function validateNodes(nodes, undefinedAttributesOK) {
    if (!Array.isArray(nodes)) {
        return "input must be an array of nodes";
    }

    const allowedNodeProperties = {
        nodeId: true,
        latitude: true,
        longitude: true,
        shippingStatus: true,
        configurationStatus: true,
        projectName: true
    };

    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        // make sure all attributes are allowed
        for (const key in node) {
            if (!(key in allowedNodeProperties)) {
                return "'" + key + "' is not an allowed node attribute";
            }
        }

        if (typeof node.nodeId !== "string") {
            return "node at index: " + i + " must have an string nodeId property";
        } else if (typeof node.latitude !== "number") {
            if (!undefinedAttributesOK) return "node at index: " + i + " must have a number 'latitude' property";
        } else if (typeof node.longitude !== "number") {
            if (!undefinedAttributesOK) return "node at index: " + i + " must have a number 'longitude' property";
        } else if (typeof node.shippingStatus !== "string") {
            if (!undefinedAttributesOK) return "node at index: " + i + " must have a string 'shippingStatus' property";
        } else if (!shippingStatusValid(node.shippingStatus)) {
            if (!undefinedAttributesOK)
                return (
                    "node at index: " +
                    i +
                    " must have a 'shippingStatus' of either 'Pending', 'Shipping', or 'Shipped'"
                );
        } else if (typeof node.configurationStatus !== "string") {
            if (!undefinedAttributesOK)
                return "node at index: " + i + " must have a string 'configurationStatus' property";
        } else if (!configurationStatusValid(node.configurationStatus)) {
            if (!undefinedAttributesOK)
                return (
                    "node at index: " +
                    i +
                    " must have a 'configurationStatus' of either 'Unconfigured', 'Configured', or 'Working'"
                );
        } else if (node.projectName && typeof node.projectName !== "string") {
            if (!undefinedAttributesOK) return "node at index: " + i + " must have a string 'projectName' property";
        }
    }
}

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

function checkProjectNamesExist(nodes) {
    let projectNames = buildProjectNameSet(nodes);

    let getProjectPromises = [];
    for (const projectName in projectNames) {
        getProjectPromises.push(Project.getProject(projectName));
    }

    // waits until all promises resolve so we can get a list of all project names that don't exist
    return Promise.all(getProjectPromises).then(results => {
        let badProjectNames = projectNames;
        results.forEach(function(result) {
            if (result.Item) {
                delete badProjectNames[result.Item.projectName];
            }
        });

        // throw an error if the project names don't exist
        if (Object.keys(badProjectNames).length !== 0) {
            console.log("this should work");
            throw {
                error: "non existant project name(s)",
                badProjectNames: badProjectNames
            };
        }
    });
}

// build set of project names so we don't check the db multiple times for the same project name.
// the keys are the projectName and the values are an array of indexes that refer to that project name.
// this will help with handling errors, and knowing which nodes have bad project names
function buildProjectNameSet(nodes) {
    let projectNames = {};
    nodes.forEach((node, index) => {
        const projectName = node.projectName;
        if (projectName) {
            if (projectNames[projectName]) {
                projectNames[node.projectName].nodeIndexes.push(index);
            } else {
                projectNames[node.projectName] = {
                    nodeIndexes: [index]
                };
            }
        }
    });
    return projectNames;
}

module.exports = router;
