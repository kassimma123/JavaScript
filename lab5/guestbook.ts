/**
 * @author Stanisław Polak <polak@agh.edu.pl>
 * Guestbook (Księga gości) application using Oak & Eta
 */
import { Application, Context, Router } from "jsr:@oak/oak";
import { Eta } from "https://deno.land/x/eta/src/index.ts";
import logger from "https://deno.land/x/oak_logger/mod.ts";

interface GuestbookEntry {
  name: string;
  message: string;
  createdAt: string;
}

// Path to data file
const DATA_FILE_PATH: string = `${Deno.cwd()}/entries.json`;

/**
 * Reads entries from the JSON file.
 * Returns empty array if file does not exist or is malformed.
 */
async function readEntries(filePath: string): Promise<GuestbookEntry[]> {
  try {
    const fileContent: string = await Deno.readTextFile(filePath);
    const parsedEntries: GuestbookEntry[] = JSON.parse(fileContent);
    return parsedEntries;
  } catch (error) {
    const err: Error = error as Error;
    if (err.name === "NotFound") {
      return [];
    }
    console.error("Failed to read or parse entries file:", err.message);
    return [];
  }
}

/**
 * Writes the array of entries to the JSON file.
 */
async function writeEntries(filePath: string, entries: GuestbookEntry[]): Promise<void> {
  try {
    const fileContent: string = JSON.stringify(entries, null, 2);
    await Deno.writeTextFile(filePath, fileContent);
  } catch (error) {
    const err: Error = error as Error;
    console.error("Failed to write entries to file:", err.message);
  }
}

// Initiate app
const app: Application = new Application();
const router: Router = new Router();
const eta: Eta = new Eta({ views: `${Deno.cwd()}/views` });

// Creating Routes
router
  .get("/", async (ctx: Context): Promise<void> => {
    const entries: GuestbookEntry[] = await readEntries(DATA_FILE_PATH);
    const renderedHtml: string = eta.render("./guestbook", {
      title: "Guestbook (Księga gości)",
      entries: entries,
    });
    ctx.response.type = "text/html";
    ctx.response.body = renderedHtml;
  })
  .post("/", async (ctx: Context): Promise<void> => {
    const reqBodyForm: URLSearchParams = await ctx.request.body.form();
    const name: string = reqBodyForm.get("name") || "Anonymous";
    const message: string = reqBodyForm.get("message") || "";

    if (name.trim() !== "" && message.trim() !== "") {
      const entries: GuestbookEntry[] = await readEntries(DATA_FILE_PATH);
      const newEntry: GuestbookEntry = {
        name: name,
        message: message,
        createdAt: new Date().toLocaleString("pl-PL"),
      };
      entries.push(newEntry);
      await writeEntries(DATA_FILE_PATH, entries);
    }

    // Redirect back to main page (Post-Redirect-Get pattern)
    ctx.response.redirect("/");
  });

// Adding middlewares
app.use(logger.logger);
app.use(logger.responseTime);
app.use(router.routes());
app.use(router.allowedMethods());

const port: number = 8000;
console.log(`Guestbook app is listening to port: ${port}`);
await app.listen({ port: port });
