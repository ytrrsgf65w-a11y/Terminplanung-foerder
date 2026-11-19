export function isAuthorized(request: Request | { headers: Headers }): boolean {
  const headers = request.headers;
  const authorization = headers.get('authorization') || '';
  const token = authorization.replace(/^Bearer\s+/i, '').trim();
  return Boolean(process.env.ADMIN_TOKEN) && token === process.env.ADMIN_TOKEN;
}

export function unauthorizedResponse() {
  return Response.json({ error: 'Nicht autorisiert' }, { status: 401 });
}
