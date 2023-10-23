import {
  Stack,
  StackProps,
  aws_lambda as lambda,
  aws_dynamodb as dynamodb,
  aws_apigateway as apigateway,
  aws_lambda_nodejs as lambdaNodeJs,
  aws_s3 as s3,
  aws_s3_deployment as s3dep,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import { join } from "path";

// const appDir = join(__dirname, '..', "path", "to", "my-project");

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
      // concurrency = 5;
      tableName = "prod-serverless-crud";
      lambdaConst = { TABLE_NAME: tableName };
      apiGatewayName = "prod-api-gw";
      bucketName = "prod-crud-app";
    } else {
      dynamodbReadWrite = 5;
      // concurrency = 5;
      tableName = "staging-serverless-crud";
      apiGatewayName = "staging-api-gw";
      bucketName = "staging-crud-app";
    }

    const welcomeLambda = new lambdaNodeJs.NodejsFunction(
      this,
      "helloHandler",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: join(__dirname, "..", "lambda", "hello", "hello.ts"),
        environment: lambdaConst,
        handler: "index.handler",
      }
    );

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

    // const myBucket = new s3.Bucket(this, "crudApp", {
    //   versioned: false,
    //   bucketName,
    //   publicReadAccess: true,
    //   websiteIndexDocument: "index.html",
    // });

    // const deployment = new s3dep.BucketDeployment(this, "deploy", {
    //   sources: [s3dep.Source.asset(appDir)],
    //   destinationBucket: myBucket,
    //   destinationKeyPrefix: "",
    // });

    // crud lambdas
    const usersApiRoot = api.root.addResource("users");
    const usersApi = usersApiRoot.addResource("{id}");

    // GET USERS
    const readLambda = new lambdaNodeJs.NodejsFunction(this, "readHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: join(__dirname, "..", "lambda", "readUsers", "readUsers.ts"),
      environment: lambdaConst,
      // reservedConcurrentExecutions: concurrency,
      handler: "index.handler",
    });

    const apiGetIntgr = new apigateway.LambdaIntegration(readLambda);
    usersApiRoot.addMethod("GET", apiGetIntgr, {
      authorizationType: apigateway.AuthorizationType.NONE,
    });
    table.grantReadData(readLambda);

    // DELETE USERS
    const deleteLambda = new lambdaNodeJs.NodejsFunction(
      this,
      "deleteHandler",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: join(__dirname, "..", "lambda", "deleteUsers", "deleteUsers.ts"),
        environment: lambdaConst,
        // reservedConcurrentExecutions: concurrency,
        handler: "index.handler",
      }
    );

    const apiDeleteIntgr = new apigateway.LambdaIntegration(deleteLambda);
    usersApi.addMethod("DELETE", apiDeleteIntgr, {
      authorizationType: apigateway.AuthorizationType.NONE,
    });
    table.grantFullAccess(deleteLambda);

    // POST USERS
    const createUsersLambda = new lambdaNodeJs.NodejsFunction(
      this,
      "createUsersHandler",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: join(__dirname, "..", "lambda", "createUsers", "createUsers.ts"),
        environment: lambdaConst,
        // reservedConcurrentExecutions: concurrency,
        handler: "index.handler",
      }
    );

    const apiPostIntgr = new apigateway.LambdaIntegration(createUsersLambda);
    usersApiRoot.addMethod("POST", apiPostIntgr, {
      authorizationType: apigateway.AuthorizationType.NONE,
    });
    table.grantWriteData(createUsersLambda);

    // UPDATE USERS
    const updateUsersLambda = new lambdaNodeJs.NodejsFunction(
      this,
      "updateUsersHandler",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: join(__dirname, "..", "lambda", "updateUsers", "updateUsers.ts"),
        environment: lambdaConst,
        // reservedConcurrentExecutions: concurrency,
        handler: "index.handler",
      }
    );

    const apiUpdateIntgr = new apigateway.LambdaIntegration(updateUsersLambda);
    usersApiRoot.addMethod("PATCH", apiUpdateIntgr, {
      authorizationType: apigateway.AuthorizationType.NONE,
    });

    table.grantWriteData(updateUsersLambda);
  }
}
