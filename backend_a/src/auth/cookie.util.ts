// backend_a/src/auth/cookie.util.ts
export const cookieName = 'access_token';

export const cookieOpts = {
  httpOnly: true,
  sameSite: 'lax' as const,   // prod: 'none' + secure: true
  secure: false,              // prod (HTTPS): true
  path: '/',                  // MUST match on clearCookie()
  maxAge: 60 * 60 * 1000,     // 1h
};
