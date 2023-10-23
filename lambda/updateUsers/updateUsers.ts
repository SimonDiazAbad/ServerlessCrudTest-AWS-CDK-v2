import { DynamoDB } from "aws-sdk";

const tableName = process.env.TABLE_NAME;
const dynamo = new DynamoDB.DocumentClient();

exports.handler = async (event: any, context: any, callback: any) => {
  const key = {
    id: event.pathParameters.id,
  };

  const { name, email, password } = JSON.parse(event.body);

  try {
    // Update user
    const data = await dynamo
      .update({
        TableName: tableName!,
        Key: key,
        UpdateExpression:
          "SET #name = :name, #email = :email, #password = :password",
        ExpressionAttributeNames: {
          "#name": "name",
          "#email": "email",
          "#password": "password",
        },
        ExpressionAttributeValues: {
          ":name": name,
          ":email": email,
          ":password": password,
        },
        ReturnValues: "ALL_NEW",
      })
      .promise();

    const updatedUser = data.Attributes;

    const response = {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Methods": "PATCH, OPTIONS",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ success: true, data: updatedUser }),
      isBase64Encoded: false,
    };

    callback(null, response);
  } catch (err) {
    const errorResponse = {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Methods": "PATCH, OPTIONS",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ success: false, error: err }),
      isBase64Encoded: false,
    };
    callback(null, errorResponse);
  }
};
