/**
 * @author Stanisław Polak <polak@agh.edu.pl>
 */
import { Application, Context, Router } from "jsr:@oak/oak/";
import { Eta } from "https://deno.land/x/eta/src/index.ts";
import logger from "https://deno.land/x/oak_logger/mod.ts";

// Initiate app
const app: Application  = new Application();
const router: Router = new Router({
  //prefix: "/admin",
});
const eta: Eta = new Eta({ views: `${Deno.cwd()}/views` });

// Allowing static file to fetch from server
/*
app.use(async (ctx: Context, next) => {
  try {
    await ctx.send({
      root: `${Deno.cwd()}/public`,
      index: "index.html",
    });
  } catch {
    await next();
  }
});
*/

// Creating Routes
router
  .get("/", (ctx: Context) => {
    const res: string = eta.render("./index", {
      title: "First Oak application in Deno",
    });
    ctx.response.body = res;
  })
  .post("/", async (ctx: Context) => {
    const reqBodyForm: URLSearchParams = await ctx.request.body.form();
    // ctx.response.type = 'text/html'
    ctx.response.body = `Hello '${reqBodyForm.get("name")}'`;
  });

// Adding middlewares
app.use(logger.logger);
app.use(logger.responseTime);
app.use(router.routes());
app.use(router.allowedMethods());

// Making app to listen to port
console.log("App is listening to port: 8000");
await app.listen({ port: 8000 });