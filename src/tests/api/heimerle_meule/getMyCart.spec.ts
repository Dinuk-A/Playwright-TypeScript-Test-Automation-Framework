import { test, expect } from '../../../fixtures';
import { env } from '../../../config/env';
import { Cart } from '../../../models';
import { assertStatusCode } from '../../../utils/api/apiAssertions';
import { authHeaders, invalidAuthHeaders, missingTenantHeaders, tenantHeaders } from '../../../utils/api/headers';
import { getResponseAsJson } from '../../../utils/api/responseHelpers';
import { HttpStatusCode } from '../../../utils/common/httpStatusCode';

/**
 * Smoke specs for GET /api/MyCart. Exercise the whole auth chain: the setup project logs in,
 * stores the token, env.authToken reads it, headers.ts builds the headers, models type the body.
 */
const params = { language: 'en' };

test.describe('MyCart - GET', { tag: ['@api', '@smoke', '@heimerle'] }, () => {
  test('TC-CART-001 returns 200 and a typed cart', async ({ cartApi }) => {
    const response = await cartApi.get(env.endpoints.cart, { headers: authHeaders(env.tenants.hm), params });
    assertStatusCode(response, HttpStatusCode.OK);

    const cart = await getResponseAsJson<Cart>(response);
    expect(Array.isArray(cart.items)).toBe(true);
    expect(cart.cartTotal.currency).toMatch(/^[A-Z]{3}$/);
    expect(Array.isArray(cart.taxPortions)).toBe(true);
  });

  test('TC-CART-002 every line total equals unit price x quantity', async ({ cartApi }) => {
    const response = await cartApi.get(env.endpoints.cart, { headers: authHeaders(env.tenants.hm), params });
    assertStatusCode(response, HttpStatusCode.OK);
    const cart = await getResponseAsJson<Cart>(response);

    // Explicit "not exercised" state instead of a silent pass on an empty cart.
    test.skip(cart.items.length === 0, 'NOT EXERCISED: the cart is empty, so no line items were checked');

    for (const item of cart.items) {
      expect(item.itemTotalPrice.amount, `line total for SKU ${item.sku}`).toBe(item.singleItemPrice.amount * item.quantity);
    }
  });

  test('TC-CART-003 invalid bearer token is rejected with 401', async ({ cartApi }) => {
    const response = await cartApi.get(env.endpoints.cart, { headers: invalidAuthHeaders(env.tenants.hm), params });
    assertStatusCode(response, HttpStatusCode.UNAUTHORIZED);
  });

  test('TC-CART-004 missing Authorization header is rejected with 401', async ({ cartApi }) => {
    const response = await cartApi.get(env.endpoints.cart, { headers: tenantHeaders(env.tenants.hm), params });
    assertStatusCode(response, HttpStatusCode.UNAUTHORIZED);
  });

  test('TC-CART-005 missing tenant header is rejected with 400', async ({ cartApi }) => {
    const response = await cartApi.get(env.endpoints.cart, { headers: missingTenantHeaders(), params });
    assertStatusCode(response, HttpStatusCode.BAD_REQUEST);
  });
});
