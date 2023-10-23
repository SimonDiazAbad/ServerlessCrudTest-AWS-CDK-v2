import { DynamoDB } from "aws-sdk";

const tableName = process.env.TABLE_NAME;
const dynamo = new DynamoDB.DocumentClient();

exports.handler = async (event: any, context: any, callback: any) => {
  const key = {
    id: event.pathParameters.id,
  };

  const body = JSON.parse(event.body);

  let updateExpression = "SET ";
  const expressionAttributeNames: { [key: string]: string } = {};
  const expressionAttributeValues: { [key: string]: any } = {};

  Object.keys(body).forEach((attribute, index) => {
    const attributeKey = `#${attribute}`;
    const attributeValue = `:${attribute}`;
    expressionAttributeNames[attributeKey] = attribute;
    expressionAttributeValues[attributeValue] = body[attribute];
    updateExpression += `${attributeKey} = ${attributeValue}`;
    if (index !== Object.keys(body).length - 1) {
      updateExpression += ", ";
    }
  });

  try {
    // Update user
    const data = await dynamo
      .update({
        TableName: tableName!,
        Key: key,
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
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
