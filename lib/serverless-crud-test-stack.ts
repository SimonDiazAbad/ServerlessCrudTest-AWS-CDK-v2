import {
  Stack,
  StackProps,
  aws_lambda as lambda,
  aws_dynamodb as dynamodb,
  aws_apigateway as apigateway,
} from "aws-cdk-lib";
import { Construct } from "constructs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

interface EvnStackProps extends StackProps {
  prod: boolean;
}

export class ServerlessCrudTestStack extends Stack {
  constructor(scope: Construct, id: string, props?: EvnStackProps) {
    super(scope, id, props);

    let tableName, lambdaConst, apiGatewayName, dynamodbReadWrite, concurrency;

    if (props?.prod) {
      dynamodbReadWrite = 200;
      concurrency = 100;
      tableName = "prod-serverless-crud";
      lambdaConst = { TABLE_NAME: tableName };
      apiGatewayName = "prod-api-gw";
    } else {
      dynamodbReadWrite = 5;
      concurrency = 5;
      tableName = "staging-serverless-crud";
      apiGatewayName = "staging-api-gw";
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
  }
}
