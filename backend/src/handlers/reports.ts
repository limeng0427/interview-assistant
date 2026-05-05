// Lambda handler for AI report generation.
// Routes:
//   GET  /sessions/{id}/report — fetch existing report
//   POST /sessions/{id}/report — generate and store report

import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { db } from '../services/dynamoService';
import { aiProxy, type GenerateReportPayload } from '../services/aiProxy';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN ?? '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'POST,GET,OPTIONS',
};

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  if (event.requestContext.http.method === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const sessionId = event.pathParameters?.['id'];
  if (!sessionId) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Session ID required' }) };
  }

  if (event.requestContext.http.method === 'GET') {
    const report = await db.getReport(sessionId);
    if (!report) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Report not found' }) };
    return { statusCode: 200, headers, body: JSON.stringify(report) };
  }

  try {
    const session = await db.getSession(sessionId);
    if (!session) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Session not found' }) };
    }

    const payload: GenerateReportPayload = {
      session: session as GenerateReportPayload['session'],
    };
    const report = await aiProxy.generateReport(payload);

    await db.putReport({ ...report });

    return { statusCode: 200, headers, body: JSON.stringify(report) };
  } catch (e) {
    console.error(e);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: e instanceof Error ? e.message : 'Failed to generate report' }),
    };
  }
};
