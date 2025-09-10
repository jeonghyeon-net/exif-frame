import { fromHono } from "chanfana";
import { Hono } from "hono";
import { cors } from "hono/cors";
// Endpoints
import { AuthLogin } from "./endpoints/authLogin";
import { AuthRegister } from "./endpoints/authRegister";
import { MemberMe } from "./endpoints/memberMe";
import { MemberUpdateMe } from "./endpoints/memberUpdateMe";
import { MemberDeleteMe } from "./endpoints/memberDeleteMe";
import { MemberFetch } from "./endpoints/memberFetch";
import { ThemeList } from "./endpoints/themeList";
import { ThemeCreate } from "./endpoints/themeCreate";
import { ThemeFetch } from "./endpoints/themeFetch";
import { ThemeUpdate } from "./endpoints/themeUpdate";
import { ThemeDelete } from "./endpoints/themeDelete";
import { ThemeDownload } from "./endpoints/themeDownload";
import { ThemeSearch } from "./endpoints/themeSearch";
import { ThemePreviewUpload } from "./endpoints/themePreviewUpload";

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

// Setup OpenAPI registry
const openapi = fromHono(app, {
  docs_url: "/",
});

// Enable CORS for all routes
app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

// Register OpenAPI endpoints
// Auth
openapi.post("/api/auth/register", AuthRegister);
openapi.post("/api/auth/login", AuthLogin);

// Members (self)
openapi.get("/api/members/me", MemberMe);
openapi.patch("/api/members/me", MemberUpdateMe);
openapi.delete("/api/members/me", MemberDeleteMe);

// Members (public fetch limited fields)
openapi.get("/api/members/:id", MemberFetch);

// Themes (global search + public fetch)
openapi.get("/api/themes", ThemeSearch);
openapi.get("/api/themes/:id", ThemeFetch);
openapi.post("/api/themes/:id/download", ThemeDownload);
openapi.post("/api/themes/:id/preview", ThemePreviewUpload);

// Themes (self)
openapi.get("/api/my/themes", ThemeList);
openapi.post("/api/my/themes", ThemeCreate);
openapi.patch("/api/themes/:id", ThemeUpdate);
openapi.delete("/api/themes/:id", ThemeDelete);

// You may also register routes for non OpenAPI directly on Hono

// Export the Hono app
export default app;
