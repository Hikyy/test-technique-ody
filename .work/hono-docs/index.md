# Hono Documentation - Local Mirror

> Source: https://hono.dev/docs/
> Method: Raw markdown fetched from https://github.com/honojs/website (docs/ tree)

Total pages: **84**

## Table of Contents

### Root (1)

- [Hono](./index.md) — Hono - _means flame🔥 in Japanese_ - is a small, simple, and ultrafast web framework built on Web Standards.  
  Source: https://hono.dev/docs/

### Getting Started (18)

- [Alibaba Cloud Function Compute](./getting-started/ali-function-compute.md) — Alibaba Cloud Function Compute is a fully managed, event-driven compute service. Function Compute allows you to focus on writing and uploading code without having to manage infrastructure such as s...  
  Source: https://hono.dev/docs/getting-started/ali-function-compute
- [AWS Lambda](./getting-started/aws-lambda.md) — AWS Lambda is a serverless platform by Amazon Web Services.  
  Source: https://hono.dev/docs/getting-started/aws-lambda
- [Azure Functions](./getting-started/azure-functions.md) — Azure Functions is a serverless platform from Microsoft Azure. You can run your code in response to events, and it automatically manages the underlying compute resources for you.  
  Source: https://hono.dev/docs/getting-started/azure-functions
- [Getting Started](./getting-started/basic.md) — Using Hono is super easy. We can set up the project, write code, develop with a local server, and deploy quickly. The same code will work on any runtime, just with different entry points. Let's loo...  
  Source: https://hono.dev/docs/getting-started/basic
- [Bun](./getting-started/bun.md) — Bun is another JavaScript runtime. It's not Node.js or Deno. Bun includes a transcompiler, we can write the code with TypeScript.  
  Source: https://hono.dev/docs/getting-started/bun
- [Cloudflare Pages](./getting-started/cloudflare-pages.md) — Cloudflare Pages is an edge platform for full-stack web applications.  
  Source: https://hono.dev/docs/getting-started/cloudflare-pages
- [Cloudflare Workers](./getting-started/cloudflare-workers.md) — Cloudflare Workers is a JavaScript edge runtime on Cloudflare CDN.  
  Source: https://hono.dev/docs/getting-started/cloudflare-workers
- [Deno](./getting-started/deno.md) — Deno is a JavaScript runtime built on V8. It's not Node.js.  
  Source: https://hono.dev/docs/getting-started/deno
- [Fastly Compute](./getting-started/fastly.md) — Fastly Compute is an advanced edge computing system that runs your code, in your favorite language, on Fastly's global edge network. Hono also works on Fastly Compute.  
  Source: https://hono.dev/docs/getting-started/fastly
- [Google Cloud Run](./getting-started/google-cloud-run.md) — Google Cloud Run is a serverless platform built by Google Cloud. You can run your code in response to events and Google automatically manages the underlying compute resources for you.  
  Source: https://hono.dev/docs/getting-started/google-cloud-run
- [Lambda@Edge](./getting-started/lambda-edge.md) — Lambda@Edge is a serverless platform by Amazon Web Services. It allows you to run Lambda functions at Amazon CloudFront's edge locations, enabling you to customize behaviors for HTTP requests/respo...  
  Source: https://hono.dev/docs/getting-started/lambda-edge
- [Netlify](./getting-started/netlify.md) — Netlify provides static site hosting and serverless backend services. Edge Functions enables us to make the web pages dynamic.  
  Source: https://hono.dev/docs/getting-started/netlify
- [Next.js](./getting-started/nextjs.md) — Next.js is a flexible React framework that gives you building blocks to create fast web applications.  
  Source: https://hono.dev/docs/getting-started/nextjs
- [Node.js](./getting-started/nodejs.md) — Node.js is an open-source, cross-platform JavaScript runtime environment.  
  Source: https://hono.dev/docs/getting-started/nodejs
- [Service Worker](./getting-started/service-worker.md) — Service Worker is a script that runs in the background of the browser to handle tasks like caching and push notifications. Using a Service Worker adapter, you can run applications made with Hono as...  
  Source: https://hono.dev/docs/getting-started/service-worker
- [Supabase Edge Functions](./getting-started/supabase-functions.md) — Supabase is an open-source alternative to Firebase, offering a suite of tools similar to Firebase's capabilities, including database, authentication, storage, and now, serverless functions.  
  Source: https://hono.dev/docs/getting-started/supabase-functions
- [Vercel](./getting-started/vercel.md) — Vercel is the AI cloud, providing the developer tools and cloud infrastructure to build, scale, and secure a faster, more personalized web.  
  Source: https://hono.dev/docs/getting-started/vercel
- [WebAssembly (w/ WASI)](./getting-started/webassembly-wasi.md) — [WebAssembly][wasm-core] is a secure, sandboxed, portable runtime that runs inside and outside web browsers.  
  Source: https://hono.dev/docs/getting-started/webassembly-wasi

### Concepts (7)

- [Benchmarks](./concepts/benchmarks.md) — Benchmarks are only benchmarks, but they are important to us.  
  Source: https://hono.dev/docs/concepts/benchmarks
- [Developer Experience](./concepts/developer-experience.md) — To create a great application, we need great development experience.  
  Source: https://hono.dev/docs/concepts/developer-experience
- [Middleware](./concepts/middleware.md) — We call the primitive that returns Response as "Handler".  
  Source: https://hono.dev/docs/concepts/middleware
- [Philosophy](./concepts/motivation.md) — In this section, we talk about the concept, or philosophy, of Hono.  
  Source: https://hono.dev/docs/concepts/motivation
- [Routers](./concepts/routers.md) — The routers are the most important features for Hono.  
  Source: https://hono.dev/docs/concepts/routers
- [Hono Stacks](./concepts/stacks.md) — Hono makes easy things easy and hard things easy.  
  Source: https://hono.dev/docs/concepts/stacks
- [Web Standards](./concepts/web-standard.md) — Hono uses only Web Standards like Fetch.  
  Source: https://hono.dev/docs/concepts/web-standard

### API (7)

- [Context](./api/context.md) — The Context object is instantiated for each request and kept until the response is returned. You can put values in it, set headers and a status code you want to return, and access HonoRequest and R...  
  Source: https://hono.dev/docs/api/context
- [HTTPException](./api/exception.md) — When a fatal error occurs, Hono (and many ecosystem middleware) may throw an HTTPException. This is a custom Hono Error that simplifies returning error responses.  
  Source: https://hono.dev/docs/api/exception
- [App - Hono](./api/hono.md) — Hono is the primary object.  
  Source: https://hono.dev/docs/api/hono
- [API](./api/index.md) — Hono's API is simple.  
  Source: https://hono.dev/docs/api/index
- [Presets](./api/presets.md) — Hono has several routers, each designed for a specific purpose.  
  Source: https://hono.dev/docs/api/presets
- [HonoRequest](./api/request.md) — The HonoRequest is an object that can be taken from c.req which wraps a Request object.  
  Source: https://hono.dev/docs/api/request
- [Routing](./api/routing.md) — Routing of Hono is flexible and intuitive.  
  Source: https://hono.dev/docs/api/routing

### Guides (12)

- [Best Practices](./guides/best-practices.md) — Hono is very flexible. You can write your app as you like.  
  Source: https://hono.dev/docs/guides/best-practices
- [Create-hono](./guides/create-hono.md) — Command-line options supported by create-hono - the project initializer that runs when you run npm create hono@latest, npx create-hono@latest, or pnpm create hono@latest.  
  Source: https://hono.dev/docs/guides/create-hono
- [Examples](./guides/examples.md) — See the Examples section.  
  Source: https://hono.dev/docs/guides/examples
- [Frequently Asked Questions](./guides/faq.md) — This guide is a collection of frequently asked questions (FAQ) about Hono and how to resolve them.  
  Source: https://hono.dev/docs/guides/faq
- [Helpers](./guides/helpers.md) — Helpers are available to assist in developing your application. Unlike middleware, they don't act as handlers, but rather provide useful functions.  
  Source: https://hono.dev/docs/guides/helpers
- [Client Components](./guides/jsx-dom.md) — hono/jsx supports not only server side but also client side. This means that it is possible to create an interactive UI that runs in the browser. We call it Client Components or hono/jsx/dom.  
  Source: https://hono.dev/docs/guides/jsx-dom
- [JSX](./guides/jsx.md) — You can write HTML with JSX syntax with hono/jsx.  
  Source: https://hono.dev/docs/guides/jsx
- [Middleware](./guides/middleware.md) — Middleware works before/after the endpoint Handler. We can get the Request before dispatching or manipulate the Response after dispatching.  
  Source: https://hono.dev/docs/guides/middleware
- [Miscellaneous](./guides/others.md) — Contributions Welcome! You can contribute in the following ways.  
  Source: https://hono.dev/docs/guides/others
- [RPC](./guides/rpc.md) — The RPC feature allows sharing of the API specifications between the server and the client.  
  Source: https://hono.dev/docs/guides/rpc
- [Testing](./guides/testing.md) — [Vitest]: https://vitest.dev/  
  Source: https://hono.dev/docs/guides/testing
- [Validation](./guides/validation.md) — Hono provides only a very thin Validator.  
  Source: https://hono.dev/docs/guides/validation

### Helpers (15)

- [Accepts Helper](./helpers/accepts.md) — Accepts Helper helps to handle Accept headers in the Requests.  
  Source: https://hono.dev/docs/helpers/accepts
- [Adapter Helper](./helpers/adapter.md) — The Adapter Helper provides a seamless way to interact with various platforms through a unified interface.  
  Source: https://hono.dev/docs/helpers/adapter
- [ConnInfo Helper](./helpers/conninfo.md) — The ConnInfo Helper helps you to get the connection information. For example, you can get the client's remote address easily.  
  Source: https://hono.dev/docs/helpers/conninfo
- [Cookie Helper](./helpers/cookie.md) — The Cookie Helper provides an easy interface to manage cookies, enabling developers to set, parse, and delete cookies seamlessly.  
  Source: https://hono.dev/docs/helpers/cookie
- [css Helper](./helpers/css.md) — The CSS helper - hono/css - is Hono's built-in CSS in JS(X).  
  Source: https://hono.dev/docs/helpers/css
- [Dev Helper](./helpers/dev.md) — Dev Helper provides useful methods you can use in development.  
  Source: https://hono.dev/docs/helpers/dev
- [Factory Helper](./helpers/factory.md) — The Factory Helper provides useful functions for creating Hono's components such as Middleware. Sometimes it's difficult to set the proper TypeScript types, but this helper facilitates that.  
  Source: https://hono.dev/docs/helpers/factory
- [html Helper](./helpers/html.md) — The html Helper lets you write HTML in JavaScript template literal with a tag named html. Using raw(), the content will be rendered as is. You have to escape these strings by yourself.  
  Source: https://hono.dev/docs/helpers/html
- [JWT Authentication Helper](./helpers/jwt.md) — This helper provides functions for encoding, decoding, signing, and verifying JSON Web Tokens (JWTs). JWTs are commonly used for authentication and authorization purposes in web applications. This ...  
  Source: https://hono.dev/docs/helpers/jwt
- [Proxy Helper](./helpers/proxy.md) — Proxy Helper provides useful functions when using Hono application as a (reverse) proxy.  
  Source: https://hono.dev/docs/helpers/proxy
- [Route Helper](./helpers/route.md) — The Route Helper provides enhanced routing information for debugging and middleware development. It allows you to access detailed information about matched routes and the current route being proces...  
  Source: https://hono.dev/docs/helpers/route
- [SSG Helper](./helpers/ssg.md) — SSG Helper generates a static site from your Hono application. It will retrieve the contents of registered routes and save them as static files.  
  Source: https://hono.dev/docs/helpers/ssg
- [Streaming Helper](./helpers/streaming.md) — The Streaming Helper provides methods for streaming responses.  
  Source: https://hono.dev/docs/helpers/streaming
- [Testing Helper](./helpers/testing.md) — The Testing Helper provides functions to make testing of Hono applications easier.  
  Source: https://hono.dev/docs/helpers/testing
- [WebSocket Helper](./helpers/websocket.md) — WebSocket Helper is a helper for server-side WebSockets in Hono applications.  
  Source: https://hono.dev/docs/helpers/websocket

### Built-in Middleware (23)

- [Basic Auth Middleware](./middleware/builtin/basic-auth.md) — This middleware can apply Basic authentication to a specified path.  
  Source: https://hono.dev/docs/middleware/builtin/basic-auth
- [Bearer Auth Middleware](./middleware/builtin/bearer-auth.md) — The Bearer Auth Middleware provides authentication by verifying an API token in the Request header.  
  Source: https://hono.dev/docs/middleware/builtin/bearer-auth
- [Body Limit Middleware](./middleware/builtin/body-limit.md) — The Body Limit Middleware can limit the file size of the request body.  
  Source: https://hono.dev/docs/middleware/builtin/body-limit
- [Cache Middleware](./middleware/builtin/cache.md) — The Cache middleware uses the Web Standards' Cache API.  
  Source: https://hono.dev/docs/middleware/builtin/cache
- [Combine Middleware](./middleware/builtin/combine.md) — Combine Middleware combines multiple middleware functions into a single middleware. It provides three functions:  
  Source: https://hono.dev/docs/middleware/builtin/combine
- [Compress Middleware](./middleware/builtin/compress.md) — This middleware compresses the response body, according to Accept-Encoding request header.  
  Source: https://hono.dev/docs/middleware/builtin/compress
- [Context Storage Middleware](./middleware/builtin/context-storage.md) — The Context Storage Middleware stores the Hono Context in the AsyncLocalStorage, to make it globally accessible.  
  Source: https://hono.dev/docs/middleware/builtin/context-storage
- [CORS Middleware](./middleware/builtin/cors.md) — There are many use cases of Cloudflare Workers as Web APIs and calling them from external front-end application.  
  Source: https://hono.dev/docs/middleware/builtin/cors
- [CSRF Protection](./middleware/builtin/csrf.md) — This middleware protects against CSRF attacks by checking both the Origin header and the Sec-Fetch-Site header. The request is allowed if either validation passes.  
  Source: https://hono.dev/docs/middleware/builtin/csrf
- [ETag Middleware](./middleware/builtin/etag.md) — Using this middleware, you can add ETag headers easily.  
  Source: https://hono.dev/docs/middleware/builtin/etag
- [IP Restriction Middleware](./middleware/builtin/ip-restriction.md) — IP Restriction Middleware is middleware that limits access to resources based on the IP address of the user.  
  Source: https://hono.dev/docs/middleware/builtin/ip-restriction
- [JSX Renderer Middleware](./middleware/builtin/jsx-renderer.md) — JSX Renderer Middleware allows you to set up the layout when rendering JSX with the c.render() function, without the need for using c.setRenderer(). Additionally, it enables access to instances of ...  
  Source: https://hono.dev/docs/middleware/builtin/jsx-renderer
- [JWK Auth Middleware](./middleware/builtin/jwk.md) — The JWK Auth Middleware authenticates requests by verifying tokens using JWK (JSON Web Key). It checks for an Authorization header and other configured sources, such as cookies, if specified. It va...  
  Source: https://hono.dev/docs/middleware/builtin/jwk
- [JWT Auth Middleware](./middleware/builtin/jwt.md) — The JWT Auth Middleware provides authentication by verifying the token with JWT.  
  Source: https://hono.dev/docs/middleware/builtin/jwt
- [Language Middleware](./middleware/builtin/language.md) — The Language Detector middleware automatically determines a user's preferred language (locale) from various sources and makes it available via c.get('language'). Detection strategies include query ...  
  Source: https://hono.dev/docs/middleware/builtin/language
- [Logger Middleware](./middleware/builtin/logger.md) — It's a simple logger.  
  Source: https://hono.dev/docs/middleware/builtin/logger
- [Method Override Middleware](./middleware/builtin/method-override.md) — This middleware executes the handler of the specified method, which is different from the actual method of the request, depending on the value of the form, header, or query, and returns its response.  
  Source: https://hono.dev/docs/middleware/builtin/method-override
- [Pretty JSON Middleware](./middleware/builtin/pretty-json.md) — Pretty JSON middleware enables "_JSON pretty print_" for JSON response body.  
  Source: https://hono.dev/docs/middleware/builtin/pretty-json
- [Request ID Middleware](./middleware/builtin/request-id.md) — Request ID Middleware generates a unique ID for each request, which you can use in your handlers.  
  Source: https://hono.dev/docs/middleware/builtin/request-id
- [Secure Headers Middleware](./middleware/builtin/secure-headers.md) — Secure Headers Middleware simplifies the setup of security headers. Inspired in part by the capabilities of Helmet, it allows you to control the activation and deactivation of specific security hea...  
  Source: https://hono.dev/docs/middleware/builtin/secure-headers
- [Timeout Middleware](./middleware/builtin/timeout.md) — The Timeout Middleware enables you to easily manage request timeouts in your application. It allows you to set a maximum duration for requests and optionally define custom error responses if the sp...  
  Source: https://hono.dev/docs/middleware/builtin/timeout
- [Server-Timing Middleware](./middleware/builtin/timing.md) — The Server-Timing Middleware provides  
  Source: https://hono.dev/docs/middleware/builtin/timing
- [Trailing Slash Middleware](./middleware/builtin/trailing-slash.md) — This middleware handles Trailing Slash in the URL on a GET request.  
  Source: https://hono.dev/docs/middleware/builtin/trailing-slash

### Middleware (1)

- [Third-party Middleware](./middleware/third-party.md) — Third-party middleware refers to middleware not bundled within the Hono package.  
  Source: https://hono.dev/docs/middleware/third-party

