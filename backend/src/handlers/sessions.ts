// Lambda handler for session CRUD.
// Routes: GET /sessions, POST /sessions, GET /sessions/{id}, DELETE /sessions/{id}

import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { v4 as uuid } from 'uuid';
import { db } from '../services/dynamoService';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN ?? '*',
  'Access-Control-Allow-Headers': 'Content-Type,x-api-key',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

function ok(body: unknown, status = 200): APIGatewayProxyResultV2 {
  return { statusCode: status, headers, body: JSON.stringify(body) };
}

function err(message: string, status = 400): APIGatewayProxyResultV2 {
  return { statusCode: status, headers, body: JSON.stringify({ error: message }) };
}

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  if (event.requestContext.http.method === 'OPTIONS') return ok({});

  const method = event.requestContext.http.method;
  const id = event.pathParameters?.['id'];

  try {
    // GET /sessions/{id}
    if (method === 'GET' && id) {
      const session = await db.getSession(id);
      if (!session) return err('Session not found', 404);
      return ok(session);
    }

    // GET /sessions
    if (method === 'GET') {
      const sessions = await db.listSessions();
      return ok(sessions);
    }

    // POST /sessions
    if (method === 'POST') {
      const body = JSON.parse(event.body ?? '{}');
      const session = { ...body, id: body.id ?? uuid(), type: 'session', createdAt: new Date().toISOString() };
      await db.putSession(session);
      return ok(session, 201);
    }

    // PUT /sessions/{id}
    if (method === 'PUT' && id) {
      const body = JSON.parse(event.body ?? '{}');
      const session = { ...body, id, updatedAt: new Date().toISOString() };
      await db.putSession(session);
      return ok(session);
    }

    // DELETE /sessions/{id}
    if (method === 'DELETE' && id) {
      await db.deleteSession(id);
      return ok({ deleted: id });
    }

    return err('Not found', 404);
  } catch (e) {
    console.error(e);
    return err('Internal server error', 500);
  }
};
