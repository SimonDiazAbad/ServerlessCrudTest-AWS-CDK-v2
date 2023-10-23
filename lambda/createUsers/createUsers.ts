import { DynamoDB } from "aws-sdk";
import { randomBytes } from "crypto";

const tableName = process.env.TABLE_NAME;
const region = process.env.AWS_REGION;
const dynamo = new DynamoDB.DocumentClient();

exports.handler = async (event: any, context: any, callback: any) => {
  const { name, email, password } = JSON.parse(event.body);
  const user = {
    id: randomBytes(16).toString("hex"),
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
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ success: true, data: user }),
      isBase64Encoded: false,
    };
    callback(null, response);
  } catch (err) {
    const errorResponse = {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ success: false, error: err }),
      isBase64Encoded: false,
    };
    callback(null, errorResponse);
  }
};
