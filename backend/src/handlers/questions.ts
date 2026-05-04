// Lambda handler for AI question generation.
// Route: POST /sessions/{id}/questions

import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { db } from '../services/dynamoService';
import { aiProxy } from '../services/aiProxy';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN ?? '*',
  'Access-Control-Allow-Headers': 'Content-Type,x-api-key',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
};

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  if (event.requestContext.http.method === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const sessionId = event.pathParameters?.['id'];
  if (!sessionId) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Session ID required' }) };
  }

  try {
    const body = JSON.parse(event.body ?? '{}');

    // Call the AI service
    const questions = await aiProxy.generateQuestions({
      mode: body.mode,
      jobTitle: body.jobTitle,
      jobDescription: body.jobDescription,
      seniority: body.seniority,
      groups: body.groups,
      questionsPerGroup: body.questionsPerGroup,
    });

    // Persist the questions back into the session record
    const session = await db.getSession(sessionId);
    if (session) {
      await db.putSession({ ...session, questions });
    }

    return { statusCode: 200, headers, body: JSON.stringify({ questions }) };
  } catch (e) {
    console.error(e);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: e instanceof Error ? e.message : 'Failed to generate questions' }),
    };
  }
};
