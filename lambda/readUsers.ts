import { DynamoDB } from "aws-sdk";

const tableName = process.env.TABLE_NAME;
const dynamo = new DynamoDB.DocumentClient();

exports.handler = async (event: any, context: any, callback: any) => {
  try{
    const data = await dynamo.scan({
      TableName: tableName!,
    }).promise();
    const response = {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(data.Items);
      isBase64Encoded: false,

    }
    callback(null, response);
  } catch(err){
    callback(err, null);
  }
};