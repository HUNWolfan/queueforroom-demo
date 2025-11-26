// Resource route to handle favicon.ico requests
// This prevents 404 errors in the console
export function loader() {
  // Return a 204 No Content response
  return new Response(null, {
    status: 204,
    headers: {
      'Content-Type': 'image/x-icon',
    },
  });
}
