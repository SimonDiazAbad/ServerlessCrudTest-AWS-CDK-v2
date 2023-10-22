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
      })
      .promise();
    const response = {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
