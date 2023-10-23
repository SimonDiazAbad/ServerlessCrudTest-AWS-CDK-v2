import { DynamoDB } from "aws-sdk";
import { getRandomValues } from "crypto";

const tableName = process.env.TABLE_NAME;
const region = process.env.AWS_REGION;
const dynamo = new DynamoDB.DocumentClient();

exports.handler = async (event: any, context: any, callback: any) => {
  const key = {
    id: event.pathParameters.id,
  };

  const { name, email, password } = JSON.parse(event.body);
  const user = {
    id: getRandomValues(new Uint8Array(32)).toString(),
    name,
    email,
    password,
  };

  try {
    const data = await dynamo
      .put({
        TableName: tableName!,
        Item: user,
      })
      .promise();
    const response = {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(data),
      isBase64Encoded: false,
    };
    callback(null, response);
  } catch (err) {
    callback(err, null);
  }
};
