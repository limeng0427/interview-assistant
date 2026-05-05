// Lambda handler for session CRUD.
// Routes: GET /sessions, POST /sessions, GET /sessions/{id}, PUT /sessions/{id}, DELETE /sessions/{id}
// userId is extracted from the Cognito JWT (sub claim) when auth is enabled.

import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { v4 as uuid } from 'uuid';
import { db } from '../services/dynamoService';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN ?? '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

function ok(body: unknown, status = 200): APIGatewayProxyResultV2 {
  return { statusCode: status, headers, body: JSON.stringify(body) };
}

function err(message: string, status = 400): APIGatewayProxyResultV2 {
  return { statusCode: status, headers, body: JSON.stringify({ error: message }) };
}

function getUserId(event: APIGatewayProxyEventV2): string | null {
  // Populated by API Gateway JWT authorizer when auth is enabled
  return (event.requestContext as { authorizer?: { jwt?: { claims?: { sub?: string } } } })
    .authorizer?.jwt?.claims?.sub ?? null;
}

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  if (event.requestContext.http.method === 'OPTIONS') return ok({});

  const method = event.requestContext.http.method;
  const id = event.pathParameters?.['id'];
  const userId = getUserId(event);

  try {
    // GET /sessions/{id}
    if (method === 'GET' && id) {
      const session = await db.getSession(id);
      if (!session) return err('Session not found', 404);
      if (userId && session['userId'] && session['userId'] !== userId) return err('Forbidden', 403);
      return ok(session);
    }

    // GET /sessions
    if (method === 'GET') {
      const sessions = userId
        ? await db.listSessionsByUser(userId)
        : await db.listSessions();
      return ok(sessions);
    }

    // POST /sessions
    if (method === 'POST') {
      const body = JSON.parse(event.body ?? '{}') as Record<string, unknown>;
      const session = {
        ...body,
        id: (body['id'] as string | undefined) ?? uuid(),
        type: 'session',
        createdAt: new Date().toISOString(),
      };
      await db.putSession(session, userId ?? undefined);
      return ok(session, 201);
    }

    // PUT /sessions/{id}
    if (method === 'PUT' && id) {
      const existing = await db.getSession(id);
      if (existing && userId && existing['userId'] && existing['userId'] !== userId) return err('Forbidden', 403);
      const body = JSON.parse(event.body ?? '{}') as Record<string, unknown>;
      const session = { ...body, id, updatedAt: new Date().toISOString() };
      await db.putSession(session, userId ?? undefined);
      return ok(session);
    }

    // DELETE /sessions/{id}
    if (method === 'DELETE' && id) {
      const existing = await db.getSession(id);
      if (existing && userId && existing['userId'] && existing['userId'] !== userId) return err('Forbidden', 403);
      await db.deleteSession(id);
      return ok({ deleted: id });
    }

    return err('Not found', 404);
  } catch (e) {
    console.error(e);
    return err('Internal server error', 500);
  }
};
