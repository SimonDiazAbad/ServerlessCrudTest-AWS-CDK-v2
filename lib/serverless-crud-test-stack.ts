import {
  Stack,
  StackProps,
  aws_lambda as lambda,
  aws_dynamodb as dynamodb,
  aws_apigateway as apigateway,
  aws_s3 as s3,
} from "aws-cdk-lib";
import { Construct } from "constructs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

interface EvnStackProps extends StackProps {
  prod: boolean;
}

export class ServerlessCrudTestStack extends Stack {
  constructor(scope: Construct, id: string, props?: EvnStackProps) {
    super(scope, id, props);

    let tableName,
      bucketName,
      lambdaConst,
      apiGatewayName,
      dynamodbReadWrite,
      concurrency;

    if (props?.prod) {
      dynamodbReadWrite = 200;
      concurrency = 100;
      tableName = "prod-serverless-crud";
      lambdaConst = { TABLE_NAME: tableName };
      apiGatewayName = "prod-api-gw";
      bucketName = "prod-crud-app";
    } else {
      dynamodbReadWrite = 5;
      concurrency = 5;
      tableName = "staging-serverless-crud";
      apiGatewayName = "staging-api-gw";
      bucketName = "staging-crud-app";
    }

    const welcomeLambda = new lambda.Function(this, "helloHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset("lambda"),
      environment: lambdaConst,
      handler: "hello.handler",
    });

    const api = new apigateway.RestApi(this, apiGatewayName, {
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    const apiHelloIntg = new apigateway.LambdaIntegration(welcomeLambda);

    const apiHello = api.root.addResource("hello");

    apiHello.addMethod("GET", apiHelloIntg, {
      authorizationType: apigateway.AuthorizationType.NONE,
    });

    const table = new dynamodb.Table(this, tableName, {
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING,
      },
      tableName: tableName,
      readCapacity: dynamodbReadWrite,
      billingMode: dynamodb.BillingMode.PROVISIONED,
    });

    const myBucket = new s3.Bucket(this, "crudApp", {
      versioned: false,
      bucketName,
      publicReadAccess: true,
      websiteIndexDocument: "index.html",
    });
  }
}
