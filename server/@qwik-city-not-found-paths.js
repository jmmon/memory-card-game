const notFounds = [
  [
    "/",
    "<html>\r\n<head>\r\n  <meta charset=\"utf-8\">\r\n  <meta http-equiv=\"Status\" content=\"404\">\r\n  <title>404 Resource Not Found</title>\r\n  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\r\n  <style>\r\n    body { color: #006ce9; background-color: #fafafa; padding: 30px; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Roboto, sans-serif; }\r\n    p { max-width: 600px; margin: 60px auto 30px auto; background: white; border-radius: 4px; box-shadow: 0px 0px 50px -20px #006ce9; overflow: hidden; }\r\n    strong { display: inline-block; padding: 15px; background: #006ce9; color: white; }\r\n    span { display: inline-block; padding: 15px; }\r\n  </style>\r\n</head>\r\n<body><p><strong>404</strong> <span>Resource Not Found</span></p></body>\r\n</html>"
  ]
];
function getNotFound(p) {
  for (const r of notFounds) {
    if (p.startsWith(r[0])) {
      return r[1];
    }
  }
  return "Resource Not Found";
}
export { getNotFound };