import { Hono } from 'hono';
import type { TaskRequest, TaskResponse } from '@devvit/web/server';
import { cleanupNegativeRecentBotComments } from '../features/cleanup-negative-comments/run.js';

export const tasks = new Hono();

tasks.post('/cleanup-negative-comments', async (c) => {
  const input = await c.req.json<TaskRequest>();
  console.log('[tasks] running', input.name);

  const result = await cleanupNegativeRecentBotComments();
  console.log('[tasks] cleanup-negative-comments result', result);

  return c.json<TaskResponse>({}, 200);
});
