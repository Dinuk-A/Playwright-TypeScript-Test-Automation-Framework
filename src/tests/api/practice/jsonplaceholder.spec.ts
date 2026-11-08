import { test, expect } from '../../../fixtures';
import { env } from '../../../config/env';
import {
  assertContentType,
  assertJsonFieldEquals,
  assertJsonFieldNotNull,
  assertJsonFieldType,
  assertResponseBodyIsEmpty,
  assertResponseTime,
  assertStatusCode,
} from '../../../utils/api/apiAssertions';
import { assertExercised } from '../../../utils/common/guards';
import { HttpStatusCode } from '../../../utils/common/httpStatusCode';

/**
 * Example API specs against https://jsonplaceholder.typicode.com (a fake REST API: writes are
 * accepted and echoed but never persisted). Shows: fixtures, ApiClient, API assertions, status
 * enum, query params, data-driven tests, vacuous-truth guard, negative cases.
 */
const BASE = env.practice.jsonPlaceholderBaseUrl;

interface Post {
  userId: number;
  id: number;
  title: string;
  body: string;
}

test.describe('JSONPlaceholder - posts', { tag: ['@api', '@practice'] }, () => {
  test('TC-JPH-001 GET /posts/1 returns the expected post', async ({ apiFor }) => {
    const api = await apiFor(BASE);
    const response = await api.get('/posts/1');

    assertStatusCode(response, HttpStatusCode.OK);
    assertContentType(response, 'application/json');
    await assertJsonFieldEquals(response, 'id', 1);
    await assertJsonFieldEquals(response, 'userId', 1);
    await assertJsonFieldNotNull(response, 'title');
    assertJsonFieldType(await response.text(), 'title', 'string');
  });

  test('TC-JPH-002 GET /posts returns the full list', async ({ apiFor }) => {
    const api = await apiFor(BASE);
    const response = await api.get('/posts');
    assertStatusCode(response, HttpStatusCode.OK);

    const posts = (await response.json()) as Post[];
    await assertExercised(posts.length, 'GET /posts');
    expect(posts).toHaveLength(100);
    for (const post of posts) {
      expect(post.title.length, `post ${post.id} has an empty title`).toBeGreaterThan(0);
    }
  });

  test('TC-JPH-003 GET /posts?userId=1 returns only that user\'s posts', async ({ apiFor }) => {
    const api = await apiFor(BASE);
    const response = await api.get('/posts', { params: { userId: 1 } });
    assertStatusCode(response, HttpStatusCode.OK);

    const posts = (await response.json()) as Post[];
    await assertExercised(posts.length, 'GET /posts?userId=1');
    for (const post of posts) {
      expect(post.userId, `post ${post.id} belongs to another user`).toBe(1);
    }
  });

  test('TC-JPH-004 GET /posts/1/comments returns comments with valid emails', async ({ apiFor }) => {
    const api = await apiFor(BASE);
    const response = await api.get('/posts/1/comments');
    assertStatusCode(response, HttpStatusCode.OK);

    const comments = (await response.json()) as Array<{ postId: number; email: string }>;
    await assertExercised(comments.length, 'GET /posts/1/comments');
    for (const comment of comments) {
      expect(comment.postId).toBe(1);
      expect(comment.email).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/);
    }
  });

  test('TC-JPH-005 POST /posts creates a post and echoes the payload', async ({ apiFor }) => {
    const api = await apiFor(BASE);
    const payload = { title: 'framework demo', body: 'created by Playwright', userId: 1 };
    const response = await api.post('/posts', { data: payload });

    assertStatusCode(response, HttpStatusCode.CREATED);
    await assertJsonFieldEquals(response, 'title', payload.title);
    await assertJsonFieldEquals(response, 'body', payload.body);
    await assertJsonFieldEquals(response, 'userId', payload.userId);
    await assertJsonFieldEquals(response, 'id', 101); // fake API always assigns 101
  });

  test('TC-JPH-006 PUT /posts/1 replaces the post', async ({ apiFor }) => {
    const api = await apiFor(BASE);
    const payload = { id: 1, title: 'updated', body: 'replaced', userId: 1 };
    const response = await api.put('/posts/1', { data: payload });

    assertStatusCode(response, HttpStatusCode.OK);
    await assertJsonFieldEquals(response, 'title', 'updated');
    await assertJsonFieldEquals(response, 'body', 'replaced');
  });

  test('TC-JPH-007 PATCH /posts/1 changes only the supplied field', async ({ apiFor }) => {
    const api = await apiFor(BASE);
    const response = await api.patch('/posts/1', { data: { title: 'patched title' } });

    assertStatusCode(response, HttpStatusCode.OK);
    await assertJsonFieldEquals(response, 'title', 'patched title');
    await assertJsonFieldEquals(response, 'id', 1);
    await assertJsonFieldNotNull(response, 'body'); // untouched fields survive
  });

  test('TC-JPH-008 DELETE /posts/1 succeeds with an empty body', async ({ apiFor }) => {
    const api = await apiFor(BASE);
    const response = await api.delete('/posts/1');

    assertStatusCode(response, HttpStatusCode.OK);
    assertResponseBodyIsEmpty(await response.text());
  });

  test('TC-JPH-009 GET /posts/9999 returns 404 with an empty object', async ({ apiFor }) => {
    const api = await apiFor(BASE);
    const response = await api.get('/posts/9999');

    assertStatusCode(response, HttpStatusCode.NOT_FOUND);
    assertResponseBodyIsEmpty(await response.text());
  });

  test('TC-JPH-010 GET /posts/1 responds within the time budget', async ({ apiFor }) => {
    const api = await apiFor(BASE);
    const started = Date.now();
    const response = await api.get('/posts/1');
    const elapsed = Date.now() - started;

    assertStatusCode(response, HttpStatusCode.OK);
    assertResponseTime(elapsed, 5000);
  });
});

test.describe('JSONPlaceholder - users (data-driven)', { tag: ['@api', '@practice'] }, () => {
  const userIds = [1, 2, 3];
  for (const id of userIds) {
    test(`TC-JPH-011 GET /users/${id} returns that user`, async ({ apiFor }) => {
      const api = await apiFor(BASE);
      const response = await api.get(`/users/${id}`);

      assertStatusCode(response, HttpStatusCode.OK);
      await assertJsonFieldEquals(response, 'id', id);
      await assertJsonFieldNotNull(response, 'address.city');
      assertJsonFieldType(await response.text(), 'address.geo.lat', 'string');
    });
  }
});
