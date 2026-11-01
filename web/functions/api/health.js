export function onRequestGet() {
  return Response.json(
    { ok: true, service: "healthsync-website", time: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } }
  );
}
