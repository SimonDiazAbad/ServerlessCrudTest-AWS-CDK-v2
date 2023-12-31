import { DynamoDB } from "aws-sdk";

const tableName = process.env.TABLE_NAME;
const region = process.env.AWS_REGION;
const dynamo = new DynamoDB.DocumentClient();

exports.handler = async (event: any, context: any, callback: any) => {
  const key = {
    id: event.pathParameters.id,
  };

  try {
    const data = await dynamo
      .delete({
        TableName: tableName!,
        Key: key,
        ReturnValues: "ALL_OLD",
      })
      .promise();
    const response = {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Methods": "DELETE, OPTIONS",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ success: true, data: data.Attributes }),
      isBase64Encoded: false,
    };
    callback(null, response);
  } catch (err) {
    const errorResponse = {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Methods": "DELETE, OPTIONS",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ success: false, error: err }),
      isBase64Encoded: false,
    };
    callback(null, errorResponse);
  }
};
