/**
 * @author Stanisław Polak <polak@agh.edu.pl>
 * Student list application using Oak, Eta & MongoDB
 */
import { Application, Router, RouterContext } from "jsr:@oak/oak";
import { Eta } from "https://deno.land/x/eta/src/index.ts";
import logger from "https://deno.land/x/oak_logger/mod.ts";
import { MongoClient, Db, Collection, WithId } from "mongodb";

interface DbStudent {
  name: string;
  faculty: string;
}

interface Student {
  fname: string;
  lname: string;
  faculty: string;
}

/**
 * Connects to MongoDB and fetches students belonging to the specified faculty.
 */
async function fetchStudentsFromDb(faculty: string): Promise<Student[]> {
  const client: MongoClient = new MongoClient("mongodb://localhost:27017");
  try {
    await client.connect();
    const db: Db = client.db("AGH");
    const collection: Collection<DbStudent> = db.collection<DbStudent>("students");

    // Fetch matching students from database
    const dbStudents: WithId<DbStudent>[] = await collection.find({ faculty: faculty }).toArray();

    // Map database documents to Student interface (split name into fname & lname)
    const mappedStudents: Student[] = dbStudents.map((s: WithId<DbStudent>): Student => {
      const parts: string[] = s.name.split(" ");
      const fname: string = parts[0] || "";
      const lname: string = parts.slice(1).join(" ") || "";
      return {
        fname: fname,
        lname: lname,
        faculty: s.faculty,
      };
    });

    return mappedStudents;
  } catch (error) {
    const err: Error = error as Error;
    console.error("Database query failed:", err.message);
    return [];
  } finally {
    await client.close();
  }
}

// Initiate app
const app: Application = new Application();
const router: Router = new Router();
const eta: Eta = new Eta({ views: `${Deno.cwd()}/views` });

// Define routing with path parameter using RouterContext
router.get("/:faculty", async (ctx: RouterContext<"/:faculty">): Promise<void> => {
  const faculty: string = ctx.params.faculty || "";
  const filteredStudents: Student[] = await fetchStudentsFromDb(faculty);

  const renderedHtml: string = eta.render("./students", {
    title: `Studenci wydziału ${faculty}`,
    students: filteredStudents,
  });

  ctx.response.type = "text/html";
  ctx.response.body = renderedHtml;
});

// Adding middlewares
app.use(logger.logger);
app.use(logger.responseTime);
app.use(router.routes());
app.use(router.allowedMethods());

const port: number = 8000;
console.log(`Server is listening to port: ${port}`);
await app.listen({ port: port });
