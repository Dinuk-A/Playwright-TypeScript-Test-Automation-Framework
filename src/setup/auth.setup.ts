import { test as setup } from '../fixtures';
import { env } from '../config/env';
import { Auth0LoginPage } from '../pages/heimerle_meule/auth0LoginPage';
import {
  captureBearerToken,
  fetchTokenFromEndpoint,
  isSessionFresh,
  STORAGE_STATE_PATH,
  writeStoredToken,
} from '../utils/api/authSession';
import { secondsUntilExpiry } from '../utils/common/jwt';

/**
 * Logs in once through Auth0, saves the browser state (.auth/user.json) and the API bearer token
 * (.auth/token.json). Runs as the `setup` project; UI @auth tests reuse the state and API tests
 * read the token through env.authToken. Skips the login while the stored session has > 10 min left.
 */
setup('authenticate via Auth0 and store session + API token', async ({ page, context }) => {
  setup.setTimeout(120_000);

  if (isSessionFresh(600)) {
    setup.info().annotations.push({ type: 'auth', description: 'Stored session is still valid - login skipped' });
    return;
  }

  const { email, password } = env.testUser;
  const login = new Auth0LoginPage(page);

  // Listen BEFORE logging in so the first authenticated API call is not missed.
  const tokenFromTraffic = env.tokenEndpoint
    ? undefined
    : captureBearerToken(page, [env.api.cartBaseUrl, env.api.productBaseUrl], 45_000);
  tokenFromTraffic?.catch(() => undefined); // reported below if we actually need it

  await login.startLoginFromApp(env.ui.baseUrl);
  await login.loginAs(email, password, 20_000);

  const token = tokenFromTraffic
    ? await tokenFromTraffic
    : await fetchTokenFromEndpoint(page, env.ui.baseUrl, env.tokenEndpoint as string);

  await context.storageState({ path: STORAGE_STATE_PATH });
  writeStoredToken(token);

  const minutes = Math.round((secondsUntilExpiry(token) ?? 0) / 60);
  setup.info().annotations.push({ type: 'auth', description: `Session stored; token valid for ~${minutes} min` });
});
