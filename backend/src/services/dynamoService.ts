// DynamoDB single-table service.
// Table design: PK = SESSION#<id>, SK = METADATA | QUESTIONS | REPORT

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient, GetCommand, PutCommand,
  QueryCommand, DeleteCommand, UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION ?? 'ap-southeast-2' });
export const ddb = DynamoDBDocumentClient.from(client);

const TABLE = process.env.DYNAMODB_TABLE ?? 'interview-assistant';

export const db = {
  async putSession(session: Record<string, unknown>) {
    await ddb.send(new PutCommand({
      TableName: TABLE,
      Item: {
        PK: `SESSION#${session['id']}`,
        SK: 'METADATA',
        ...session,
        updatedAt: new Date().toISOString(),
      },
    }));
  },

  async getSession(id: string) {
    const res = await ddb.send(new GetCommand({
      TableName: TABLE,
      Key: { PK: `SESSION#${id}`, SK: 'METADATA' },
    }));
    return res.Item ?? null;
  },

  async listSessions() {
    // In a real app, scope by userId (GSI). For now return a scan-like query.
    // We use a reserved PK prefix pattern — swap for a user GSI when auth is added.
    const res = await ddb.send(new QueryCommand({
      TableName: TABLE,
      IndexName: 'TypeIndex',
      KeyConditionExpression: '#t = :t',
      ExpressionAttributeNames: { '#t': 'type' },
      ExpressionAttributeValues: { ':t': 'session' },
      Limit: 50,
      ScanIndexForward: false,
    }));
    return res.Items ?? [];
  },

  async deleteSession(id: string) {
    await ddb.send(new DeleteCommand({
      TableName: TABLE,
      Key: { PK: `SESSION#${id}`, SK: 'METADATA' },
    }));
  },

  async putReport(report: Record<string, unknown>) {
    await ddb.send(new PutCommand({
      TableName: TABLE,
      Item: {
        PK: `SESSION#${report['sessionId']}`,
        SK: 'REPORT',
        ...report,
      },
    }));
  },

  async getReport(sessionId: string) {
    const res = await ddb.send(new GetCommand({
      TableName: TABLE,
      Key: { PK: `SESSION#${sessionId}`, SK: 'REPORT' },
    }));
    return res.Item ?? null;
  },
};
