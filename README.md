# Why Serverless Framework

For this project I ended up using the Serverless framework:
https://serverless.com/
https://github.com/serverless/serverless

I chose this framework for two main reasons. It seems to be the most widely adopted (over 20000 stars on github) which comes with all the usual benefits of wide adoption (more examples, more stackoverflow answers, less bugs, more libraries etc). They also work with more than one serverless provider, not just AWS Lambda. So if you would like to switch from Lambda to (say) Google Cloud Functions, you can do so with (presumably) less of a problem than if you chose a framework that was locked in to one provider.

# Authentication

When deploying the application, aws will give you an api key.

To Authenticate, add a header with the key ```x-api-key``` and value ```[your-api-key]```

# API

The base url for my deployed application is https://phrzt8jcrd.execute-api.us-east-1.amazonaws.com/dev
(If you copy this project and deploy it yourself, you will get a different endpoint)

To **add or update node(s)** send a POST to https://phrzt8jcrd.execute-api.us-east-1.amazonaws.com/dev/nodes

You can have something like this in the body:

```
[{
    "nodeId": "ID1",
    "latitude": 12.34,
    "longitude": 56.78,
    "shippingStatus": "Pending",
    "configurationStatus": "Unconfigured",
    "projectName": "testProjectName2"
},
{
    "nodeId": "ID2",
    "latitude": 12.34,
    "longitude": 56.78,
    "shippingStatus": "Pending",
    "configurationStatus": "Unconfigured"
},
{
    "nodeId": "ID3",
    "latitude": 12.34,
    "longitude": 56.78,
    "shippingStatus": "Pending",
    "configurationStatus": "Unconfigured",
    "projectName": "testProjectName2"
}]
```

To **update a node**, send a PATCH request to https://phrzt8jcrd.execute-api.us-east-1.amazonaws.com/dev/nodes/:nodeId
You can have something like this in the body:

```
{
	"node": {
		"nodeId": "testNodeID",
		"latitude": 222.22, //changed value
	},
	"shouldRemoveProjectName": true
}
```
(Any properties in "node" besides the nodeId will be changed. Set "shouldRemoveProjectName" to a truthy value to remove the project name)

To **get a node**, send a GET request to https://phrzt8jcrd.execute-api.us-east-1.amazonaws.com/dev/nodes/:nodeId

To **list all nodes**, send a GET request to https://phrzt8jcrd.execute-api.us-east-1.amazonaws.com/dev/nodes

To **list all nodes by projectName**, send a GET request to https://phrzt8jcrd.execute-api.us-east-1.amazonaws.com/dev/nodes?projectName={{projectName}}

To **add a project** send a PUT request to https://phrzt8jcrd.execute-api.us-east-1.amazonaws.com/dev/projects/:projectName
You can have something like this in the body:
```
{
    "projectName": "projectName1",
    "customer": "testCustomer",
    "startDate": "01-02-18",
    "endDate": "02-02-28"
}
```

To **update a project** send a PATCH request to https://phrzt8jcrd.execute-api.us-east-1.amazonaws.com/dev/projects
You can have something like this in the body:
```
{
	"projectName": "projectName1",
    "customer": "updatedCustomer"
}
```

To **get a project** send a GET request to https://phrzt8jcrd.execute-api.us-east-1.amazonaws.com/dev/projects/:projectName

To **list all projects** send a GET request to https://phrzt8jcrd.execute-api.us-east-1.amazonaws.com/dev/projects/:projectName

# Sources

My main source was this tutorial: https://serverless.com/blog/serverless-express-rest-api/
To figure out how to protect the endpoints I used this: https://serverless.com/framework/docs/providers/aws/events/apigateway/#http-endpoints-with-aws_iam-authorizers
I used this post to help me figure out how to scan more than 1mb of data: https://stackoverflow.com/questions/43199385/how-to-exceed-the-limit-of-scan-data-for-1mb-in-dynamodb
I also used prettier (https://prettier.io/) to format the code.

# Running Locally

(note: authorization doesn't work locally)

To run locally you need to download serverless by running ```npm install -g serverless```
Then, in this directory run the command ```npm install```
Then, in this directory run the command ```sls offline start```
Then your base url will be http://localhost:3000/.

If that doesn't do it for you let me know and I may be able to help.
