# Why Serverless Framework

For this project I ended up using the Serverless framework:
https://serverless.com/
https://github.com/serverless/serverless

I chose this framework for two main reasons. It seems to be the most widely adopted (over 20000 stars on github) which comes with all the usual benefits of wide adoption (more examples, more stackoverflow answers, less bugs, more libraries etc). They also work with more than one serverless provider, not just AWS Lambda. So if you would like to switch from Lambda to (say) Google Cloud Functions, you can do so with (presumably) less of a problem than if you chose a framework that was locked in to one provider.

# Authentication

I'd recommend using Postman to access the api as they will handle signing the request for you with the aws credentials

In Postman, under the Authorization tab, select the AWS Signature Type.
Then enter the following:

AccessKey: [removed]
SecretKey: [removed]
Region: us-east-1
Service Name: execute-api

# API

The base url is https://phrzt8jcrd.execute-api.us-east-1.amazonaws.com/dev/

To add or update Node(s) send a POST to https://phrzt8jcrd.execute-api.us-east-1.amazonaws.com/dev/nodes

You can have something like this in the body:

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

To get a node send a GET request to https://phrzt8jcrd.execute-api.us-east-1.amazonaws.com/dev/nodes/:nodeId

To add a Project send a PUT request to https://phrzt8jcrd.execute-api.us-east-1.amazonaws.com/dev/projects/:projectName
You can have something like this in the body:

{
	"projectName": "projectName1",
    "customer": "testCustomer",
    "startDate": "01-02-18",
    "endDate": "02-02-28"
}

To get a project send a GET request to https://phrzt8jcrd.execute-api.us-east-1.amazonaws.com/dev/projects/:projectName

# Sources

My main source was this: https://serverless.com/blog/serverless-express-rest-api/
To figure out how to protect the endpoints I used this: https://serverless.com/framework/docs/providers/aws/events/apigateway/#http-endpoints-with-aws_iam-authorizers
I also used prettier (https://prettier.io/) to format the code.

# Running Locally

(note: authorization doesn't work locally)

To run locally you need to download serverless by running ```npm install -g serverless```
Then, in this directory run the command ```npm install```
Then, in this directory run the command ```sls offline start```
Then your base url will be http://localhost:3000/.

If that doesn't do it for you let me know and I may be able to help.
