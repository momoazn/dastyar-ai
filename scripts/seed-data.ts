import {
  CommentsRecord,
  ProjectsRecord,
  TasksRecord,
  TypedPocketBase,
  UsersProjectsRecord,
  UsersRecord,
} from "@/lib/pocketbase-types";
import { Database } from "bun:sqlite";
import { join } from "path";
import PocketBase from "pocketbase";

// --- Mock Data Imports ---
import mockComments from "../mock-data/comments.json";
import mockProjects from "../mock-data/projects.json";
import mockTasks from "../mock-data/tasks.json";
import mockUserProjects from "../mock-data/userProjects.json";
import mockUsers from "../mock-data/users.json";

// --- Constants ---
const PB_URL = process.env.POCKETBASE_URL || "http://127.0.0.1:8090/";
const PB_ADMIN_EMAIL =
  process.env.POCKETBASE_ADMIN_EMAIL || "admin@example.com";
const PB_ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || "admin12345";
const DB_PATH = join(import.meta.dirname, "..", "data", "data.db");

// --- Type Definitions ---
interface PocketBaseErrorData {
  code: number;
  message: string;
  data: Record<string, unknown>;
}

interface PocketBaseError {
  originalError: {
    status: number;
    data: PocketBaseErrorData;
    isAbort: boolean;
    // Add other properties as needed
  };
}

function isPocketBaseError(error: unknown): error is PocketBaseError {
  return (
    typeof error === "object" &&
    error !== null &&
    "originalError" in error &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    typeof (error as any).originalError === "object" &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (error as any).originalError !== null &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    "data" in (error as any).originalError
  );
}

// Using generated types is generally good, but for seeding,
// the imported JSON structure might differ slightly (e.g., lacking expand).
// Using Partial or defining specific input types might be necessary if issues arise.

type MockUser = (typeof mockUsers)[number];
type MockProject = (typeof mockProjects)[number];
type MockUserProject = (typeof mockUserProjects)[number];
type MockTask = (typeof mockTasks)[number];
type MockComment = (typeof mockComments)[number];

// --- Helper Functions ---

/** Truncates PocketBase collection tables using direct SQLite access. */
function truncateTables(dbPath: string) {
  console.log("Attempting to truncate tables...");
  let db: Database | null = null;
  try {
    db = new Database(dbPath);
    // Order matters due to foreign key constraints
    db.run(`
      DELETE FROM comments;
      DELETE FROM tasks;
      DELETE FROM users_projects;
      DELETE FROM projects;
      DELETE FROM users;
    `);
    console.log("Successfully truncated tables.");
  } catch (error) {
    console.error("Error truncating tables:", error);
    // Decide if seeding should continue or halt
    throw error; // Re-throw if truncation is critical
  } finally {
    db?.close();
  }
}

// --- Main Seeding Logic ---
async function seedDatabase() {
  // 1. Truncate existing data
  truncateTables(DB_PATH);

  // 2. Initialize PocketBase client
  const pb = new PocketBase(PB_URL) as TypedPocketBase;

  try {
    // 3. Authenticate as admin
    console.log(`Authenticating with PocketBase at ${PB_URL} as admin...`);
    await pb
      .collection("_superusers") // Use _superusers for admin login
      .authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD);
    console.log("Authentication successful.");

    // 4. Insert Users
    console.log(`Inserting ${mockUsers.length} users...`);
    let batch = pb.createBatch();
    mockUsers.forEach((user: MockUser) =>
      batch.collection("users").create(user),
    );
    let result = await batch.send();
    console.log(`Insert users result: ${result[0].status}`);
    const createdUsers = await pb
      .collection("users")
      .getFullList<UsersRecord>();
    const userIdMap = new Map<string, string>(
      createdUsers.map((u) => [u.username, u.id]),
    );
    console.log(`${createdUsers.length} users inserted.`);

    // 5. Insert Projects
    console.log(`Inserting ${mockProjects.length} projects...`);
    batch = pb.createBatch();
    mockProjects.forEach((project: MockProject) => {
      const supervisorId = userIdMap.get(project.supervisor);
      if (supervisorId) {
        batch.collection("projects").create({
          ...project,
          supervisor: supervisorId,
        });
      }
    });
    result = await batch.send();
    console.log(`Insert projects result: ${result[0].status}`);
    const createdProjects = await pb
      .collection("projects")
      .getFullList<ProjectsRecord>();
    const projectIdMap = new Map<string, string>(
      createdProjects
        .filter((p): p is ProjectsRecord & { code: string } => Boolean(p.code))
        .map((p) => [p.code, p.id]),
    );
    console.log(`${createdProjects.length} projects inserted.`);

    // 6. Insert User-Project Links
    console.log(`Inserting ${mockUserProjects.length} user-project links...`);
    batch = pb.createBatch();
    mockUserProjects.forEach((userProject: MockUserProject) => {
      const userId = userIdMap.get(userProject.user);
      const projectId = projectIdMap.get(userProject.project);
      if (userId && projectId) {
        batch.collection("users_projects").create({
          // Ensure structure matches UsersProjectsRecord
          user: userId,
          project: projectId,
          created: userProject.created, // Keep original creation date if needed
        });
      } else {
        console.warn(
          `Skipping user-project link: User '${userProject.user}' or Project '${userProject.project}' not found. `,
        );
      }
    });
    result = await batch.send();
    console.log(`Insert user-project links result: ${result[0].status}`);
    const createdUserProjects = await pb
      .collection("users_projects")
      .getFullList<UsersProjectsRecord>();
    console.log(`${createdUserProjects.length} user-project links inserted.`);

    // 7. Insert Tasks
    console.log(`Inserting ${mockTasks.length} tasks...`);
    batch = pb.createBatch();
    mockTasks.forEach((task: MockTask) => {
      const creatorId = userIdMap.get(task.creator);
      const assigneeId = userIdMap.get(task.assignee);
      const projectId = projectIdMap.get(task.project);
      if (creatorId && assigneeId && projectId) {
        batch.collection("tasks").create({
          ...task,
          creator: creatorId,
          assignee: assigneeId,
          project: projectId,
        });
      } else {
        console.warn(
          `Skipping task '${task.title}': Creator '${task.creator}', Assignee '${task.assignee}', or Project '${task.project}' not found.`,
        );
      }
    });
    result = await batch.send();
    console.log(`Insert tasks result: ${result[0].status}`);
    const createdTasks = await pb
      .collection("tasks")
      .getFullList<TasksRecord>();
    const taskIdMap = new Map<string, string>(
      createdTasks
        .filter((t): t is TasksRecord & { display_id: string } =>
          Boolean(t.display_id),
        )
        .map((t) => [t.display_id, t.id]),
    );
    console.log(`${createdTasks.length} tasks inserted.`);

    // 8. Insert Comments
    console.log(`Inserting ${mockComments.length} comments...`);
    batch = pb.createBatch();
    mockComments.forEach((comment: MockComment) => {
      const userId = userIdMap.get(comment.user);
      const taskId = taskIdMap.get(comment.task);
      if (userId && taskId) {
        batch.collection("comments").create({
          ...comment,
          user: userId,
          task: taskId,
        });
      } else {
        console.warn(
          `Skipping comment: User '${comment.user}' or Task '${comment.task}' not found.`,
        );
      }
    });
    result = await batch.send();
    console.log(`Insert comments result: ${result[0].status}`);
    const createdComments = await pb
      .collection("comments")
      .getFullList<CommentsRecord>();
    console.log(`${createdComments.length} comments inserted.`);

    // 9. Final Summary
    console.log(
      "\n✅ Successfully Seeded Database with mock data",
      `\n- ${createdUsers.length} users created`,
      `\n- ${createdProjects.length} projects created`,
      `\n- ${createdUserProjects.length} user-project links created`,
      `\n- ${createdTasks.length} tasks created`,
      `\n- ${createdComments.length} comments created`,
    );
  } catch (error: unknown) {
    console.error("\n❌ Error during seeding process:");

    if (isPocketBaseError(error)) {
      console.error("PocketBase Error:", error.originalError);
      if (error.originalError.data) {
        console.error(
          "PocketBase Error Details:",
          JSON.stringify(error.originalError.data, null, 2),
        );
      }
    } else {
      // Log other types of errors
      console.error("Unknown Error:", error);
    }

    process.exit(1);
  } finally {
    // Ensure PocketBase connection is closed or resources are released if necessary
    // pb.authStore.clear(); // Example: Clear auth state
  }
}

seedDatabase();
