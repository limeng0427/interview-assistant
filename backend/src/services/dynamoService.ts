// DynamoDB single-table service.
// Table design: PK = SESSION#<id>, SK = METADATA | REPORT

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient, GetCommand, PutCommand,
  QueryCommand, DeleteCommand,
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION ?? 'ap-southeast-2' });
export const ddb = DynamoDBDocumentClient.from(client);

const TABLE = process.env.DYNAMODB_TABLE ?? 'interview-assistant';
const TTL_DAYS = 90;

function ttlFor(days: number) {
  return Math.floor(Date.now() / 1000) + days * 86400;
}

export const db = {
  async putSession(session: Record<string, unknown>, userId?: string) {
    await ddb.send(new PutCommand({
      TableName: TABLE,
      Item: {
        PK: `SESSION#${session['id']}`,
        SK: 'METADATA',
        type: 'session',
        ...session,
        ...(userId ? { userId } : {}),
        updatedAt: new Date().toISOString(),
        ttl: ttlFor(TTL_DAYS),
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

  async listSessionsByUser(userId: string) {
    const res = await ddb.send(new QueryCommand({
      TableName: TABLE,
      IndexName: 'UserIndex',
      KeyConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: { ':uid': userId },
      Limit: 50,
      ScanIndexForward: false,
    }));
    return res.Items ?? [];
  },

  async listSessions() {
    // Fallback for unauthenticated/dev — queries by type
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
        type: 'report',
        ...report,
        ttl: ttlFor(TTL_DAYS),
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
