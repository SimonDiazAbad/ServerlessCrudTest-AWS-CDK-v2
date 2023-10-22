#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { ServerlessCrudTestStack } from "../lib/serverless-crud-test-stack";

const app = new cdk.App();
new ServerlessCrudTestStack(app, "prod-ServerlessCrudTestStack", {
  prod: true,
  env: {
    region: "us-east-1",
  },
});

new ServerlessCrudTestStack(app, "staging-ServerlessCrudTestStack", {
  prod: false,
  env: {
    region: "us-east-1",
  },
});
