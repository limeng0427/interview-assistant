// Lambda handler for AI question generation.
// Routes:
//   POST /questions                  — generate only (no session storage)
//   POST /sessions/{id}/questions    — generate and persist to session

import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { db } from '../services/dynamoService';
import { aiProxy } from '../services/aiProxy';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN ?? '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
};

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  if (event.requestContext.http.method === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const body = JSON.parse(event.body ?? '{}') as {
      mode: string; jobTitle: string; jobDescription: string;
      seniority: string; groups: string[]; questionsPerGroup: number;
    };

    const questions = await aiProxy.generateQuestions({
      mode: body.mode as 'interviewer' | 'interviewee',
      jobTitle: body.jobTitle,
      jobDescription: body.jobDescription,
      seniority: body.seniority as 'junior' | 'intermediate' | 'senior' | 'lead',
      groups: body.groups as ('technical' | 'system-design' | 'behavioural' | 'leadership' | 'communication' | 'culture-fit' | 'problem-solving' | 'domain-knowledge')[],
      questionsPerGroup: body.questionsPerGroup,
    });

    // If there's a session ID in the path, persist questions to that session
    const sessionId = event.pathParameters?.['id'];
    if (sessionId) {
      const session = await db.getSession(sessionId);
      if (session) {
        await db.putSession({ ...session, questions });
      }
    }

    return { statusCode: 200, headers, body: JSON.stringify(questions) };
  } catch (e) {
    console.error(e);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: e instanceof Error ? e.message : 'Failed to generate questions' }),
    };
  }
};
