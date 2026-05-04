// Lambda handler for AI report generation.
// Route: POST /sessions/{id}/report

import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { db } from '../services/dynamoService';
import { aiProxy } from '../services/aiProxy';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN ?? '*',
  'Access-Control-Allow-Headers': 'Content-Type,x-api-key',
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

  // GET /sessions/{id}/report — fetch existing report
  if (event.requestContext.http.method === 'GET') {
    const report = await db.getReport(sessionId);
    if (!report) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Report not found' }) };
    return { statusCode: 200, headers, body: JSON.stringify(report) };
  }

  // POST /sessions/{id}/report — generate report
  try {
    const session = await db.getSession(sessionId);
    if (!session) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Session not found' }) };
    }

    const report = await aiProxy.generateReport({ session: session as Record<string, unknown> });

    await db.putReport({
      ...report,
      sessionId,
      generatedAt: new Date().toISOString(),
    });

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
