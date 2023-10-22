import {
  Stack,
  StackProps,
  aws_lambda as lambda,
  aws_dynamodb as dynamodb,
  aws_apigateway as apigateway,
  aws_s3 as s3,
  aws_s3_deployment as s3dep,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import { join } from "path";

const appDir = join(__dirname, "path", "to", "my-project");

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

    const deployment = new s3dep.BucketDeployment(this, "deploy", {
      sources: [s3dep.Source.asset(appDir)],
      destinationBucket: myBucket,
      destinationKeyPrefix: "",
    });

    // crud lambdas
    const usersApi = api.root.addResource("users");

    // GET USERS
    const readLambda = new lambda.Function(this, "readHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset("lambda"),
      environment: lambdaConst,
      reservedConcurrentExecutions: concurrency,
      handler: "readUsers.handler",
    });

    const apiGetIntgr = new apigateway.LambdaIntegration(readLambda);
    usersApi.addMethod("GET", apiGetIntgr);
    table.grantReadData(readLambda);

    // DELETE USERS
    const deleteLambda = new lambda.Function(this, "deleteHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset("lambda"),
      environment: lambdaConst,
      reservedConcurrentExecutions: concurrency,
      handler: "deleteUsers.handler",
    });

    const apiDeleteIntgr = new apigateway.LambdaIntegration(deleteLambda);
    usersApi.addMethod("DELETE", apiDeleteIntgr);
    table.grantFullAccess(deleteLambda);
  }
}
