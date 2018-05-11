const express = require("express");
const router = express.Router();
const Project = require("./db");

// List all projects endpoint
router.get("", function(req, res) {
    let projects = [];
    Project.listProjects()
        .then(onScan)
        .catch(sendError);

    function onScan(result) {
        projects = projects.concat(result.Items);
        if (result.LastEvaluatedKey) {
            Project.listProjects(result.LastEvaluatedKey)
                .then(onScan)
                .catch(sendError);
        } else {
            res.json(projects);
        }
    }

    function sendError(error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});

// Get Project endpoint
router.get("/:projectName", function(req, res) {
    Project.getProject(req.params.projectName)
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

router.put("/:projectName", function(req, res) {
    const project = req.body;
    if (project.projectName !== req.params.projectName) {
        res.status(409).json({ error: "'projectName' must match the name given in the url" });
        return;
    }

    const undefinedAttributesOK = false;
    const err = validateProject(project, undefinedAttributesOK);
    if (err) {
        res.status(400).json({ error: err });
        return;
    }

    Project.putProject(project)
        .then(data => {
            // project with projectName already exists
            if (data.Attributes) {
                res.status(204).send(); // no body on successful put request
            } else {
                res.status(201).send(); // no body on successful put request
            }
        })
        .catch(error => {
            if (error) {
                console.log(error);
                res.status(500).json({ error: error.message });
            }
        });
});

// Update Project endpoint
router.patch("/:projectName", function(req, res) {
    const project = req.body;
    if (project.projectName !== req.params.projectName) {
        res.status(409).json({ error: "'projectName' must match the name given in the url" });
        return;
    }

    const undefinedAttributesOK = true;
    const err = validateProject(project, undefinedAttributesOK);
    if (err) {
        res.status(400).json({ error: err });
        return;
    }

    Project.updateProject(project)
        .then(() => {
            res.status(204).send(); // no body on successful patch request
        })
        .catch(error => {
            console.log(error);

            if (error.badProjectNames) {
                res.status(404).json(error);
            } else if (error.code === "ConditionalCheckFailedException") {
                res.status(404).json({ error: "project with name '" + project.projectName + "' not found" });
            } else {
                res.status(500).json({ error: error.message });
            }
        });
});

function validateProject(project, undefinedAttributesOK) {
    // validate the project
    const allowedProjectProperties = {
        projectName: true,
        customer: true,
        startDate: true,
        endDate: true
    };

    // make sure all attributes are allowed
    for (const key in project) {
        if (!(key in allowedProjectProperties)) {
            return "'" + key + "' is not an allowed project attribute";
        }
    }

    if (typeof project.projectName !== "string") {
        return "'projectName' must be a string";
    } else if (typeof project.customer !== "string") {
        if (!undefinedAttributesOK) return "'customer' must be a string";
    } else if (typeof project.startDate !== "string") {
        if (!undefinedAttributesOK) return "'startDate' must be a string";
    } else if (typeof project.endDate !== "string") {
        if (!undefinedAttributesOK) return "'endDate' must be a string";
    }
}

module.exports = router;
