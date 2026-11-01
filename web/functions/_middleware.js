export function onRequest(context) {
  const url = new URL(context.request.url);
  if (["www.healthysync.app", "healthysync.pages.dev"].includes(url.hostname)) {
    url.protocol = "https:";
    url.hostname = "healthysync.app";
    return Response.redirect(url.toString(), 301);
  }
  return context.next();
}
