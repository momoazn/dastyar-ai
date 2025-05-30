import {
  CommentsRecord,
  ProjectsRecord,
  TasksPriorityOptions,
  TasksRecord,
  TasksStatusOptions,
  UsersProjectsRecord,
  UsersRecord,
  UsersRoleOptions,
} from "@/lib/pocketbase-types";
import { faker } from "@faker-js/faker/locale/fa";
import { mkdir } from "node:fs/promises"; // Use Node's fs for directory creation
import { join } from "path";

// --- Constants ---
const ADMIN_COUNT = 2;
const SUPERVISOR_COUNT = 5;
const EMPLOYEE_COUNT = 10;
const PROJECT_COUNT = 10;
const TASKS_COUNT = 30;
const COMMENTS_COUNT = 100;
const MOCK_DATA_DIR = join(import.meta.dirname, "..", "mock-data");
const DEFAULT_USER: GeneratedUser = {
  username: "gyw_myrzadh90",
  first_name: "پیمان",
  last_name: "قانونی",
  password: "qtmy941lZR",
  passwordConfirm: "qtmy941lZR",
  role: UsersRoleOptions.admin,
};

// --- Utility Functions ---
// function capitalize(str: string): string {
//   return str.charAt(0).toUpperCase() + str.slice(1);
// }

// --- Type Definitions ---
type GeneratedUser = Omit<UsersRecord, "id" | "tokenKey"> & {
  passwordConfirm: string;
};

type GeneratedProject = Omit<ProjectsRecord, "id"> & {
  supervisor: string; // Required, using username
};

type GeneratedTask = Omit<TasksRecord, "id" | "expand"> & {
  display_id: string; // Required
  project: string; // Required, using project code
  creator: string; // Required, using username
  assignee: string; // Required, using username
};

type GeneratedComment = Omit<CommentsRecord, "id" | "expand"> & {
  task: string; // Required, using task display_id
  user: string; // Required, using username
  content: string; // Required
  created: string; // Required
};

type GeneratedUserProject = Omit<UsersProjectsRecord, "id" | "expand"> & {
  user: string; // Required, using username
  project: string; // Required, using project code
  created: string; // Required
};

// --- Data Generation Functions ---

function generateUser(role: UsersRoleOptions): GeneratedUser {
  const person = faker.person;
  const password = faker.internet.password({ length: 10 });

  return {
    username: faker.internet.username(),
    first_name: person.firstName(),
    last_name: person.lastName(),
    password,
    passwordConfirm: password,
    role,
  };
}

function generateUsersByRole(
  role: UsersRoleOptions,
  count: number,
): GeneratedUser[] {
  return Array.from({ length: count }, () => generateUser(role));
}

function generateUsers(): GeneratedUser[] {
  return [
    ...generateUsersByRole(UsersRoleOptions.admin, ADMIN_COUNT),
    ...generateUsersByRole(UsersRoleOptions.supervisor, SUPERVISOR_COUNT),
    ...generateUsersByRole(UsersRoleOptions.employee, EMPLOYEE_COUNT),
  ];
}

function generateComments(
  tasks: GeneratedTask[],
  supervisors: GeneratedUser[],
): GeneratedComment[] {
  return Array.from({ length: COMMENTS_COUNT }, () => {
    const task = faker.helpers.arrayElement(tasks);
    const supervisor = faker.helpers.arrayElement(supervisors);

    if (!task?.display_id || !supervisor?.username) {
      return null;
    }

    return {
      task: task.display_id,
      user: supervisor.username,
      content: faker.lorem.sentence(),
      created: faker.date.recent().toISOString(),
    };
  }).filter(
    (comment): comment is NonNullable<typeof comment> => comment !== null,
  );
}

function generateTasks(
  supervisors: GeneratedUser[],
  employees: GeneratedUser[],
  projects: GeneratedProject[],
): GeneratedTask[] {
  const projectCodeToTaskCount: Record<string, number> = {};

  return Array.from({ length: TASKS_COUNT }, () => {
    const createdAt = faker.date.recent({ days: 10 });
    const updatedAt = faker.date.between({ from: createdAt, to: new Date() });
    const project = faker.helpers.arrayElement(projects);
    const projectCode = project.code as string;

    const taskCount = projectCodeToTaskCount[projectCode] ?? 1;
    projectCodeToTaskCount[projectCode] = taskCount + 1;

    return {
      title: faker.lorem.sentence(),
      display_id: projectCode + "-" + taskCount.toString().padStart(3, "0"),
      description: faker.lorem.paragraph(),
      project: projectCode, // Link by code
      creator: faker.helpers.arrayElement(supervisors).username, // Link by username
      assignee: faker.helpers.arrayElement(employees).username, // Link by username
      priority: faker.helpers.arrayElement(Object.values(TasksPriorityOptions)),
      status: faker.helpers.arrayElement(Object.values(TasksStatusOptions)),
      deadline: faker.date.soon({ days: 15 }).toISOString(),
      created: createdAt.toISOString(),
      updated: updatedAt.toISOString(),
    };
  });
}

function generateProjects(
  supervisors: GeneratedUser[],
  count: number = PROJECT_COUNT,
): GeneratedProject[] {
  return Array.from({ length: count }, () => ({
    name: faker.company.name(),
    code: faker.string.alpha({ length: 3, casing: "upper" }),
    supervisor: faker.helpers.arrayElement(supervisors).username,
    created: faker.date.recent().toISOString(),
  }));
}

function generateUserProjects(
  users: GeneratedUser[],
  projects: GeneratedProject[],
): GeneratedUserProject[] {
  const userProjects: (GeneratedUserProject | null)[] = [];
  users.forEach((user) => {
    if (!user?.username) return;

    const numProjects = faker.number.int({ min: 1, max: 3 });
    const selectedProjects = faker.helpers.arrayElements(projects, numProjects);

    selectedProjects.forEach((project) => {
      if (!project?.code) {
        console.warn(
          "Skipping user-project link generation: missing project code",
        );
        return;
      }

      userProjects.push({
        user: user.username,
        project: project.code,
        created: faker.date.recent().toISOString(),
      });
    });
  });

  return userProjects.filter((up): up is NonNullable<typeof up> => up !== null);
}

// --- Main Generation Logic ---
async function generate() {
  const users = [DEFAULT_USER, ...generateUsers()];
  const supervisors = users.filter(
    (user) => user.role === UsersRoleOptions.supervisor,
  );
  const employees = users.filter(
    (user) => user.role === UsersRoleOptions.employee,
  );
  const projects = generateProjects(supervisors);
  const userProjects = generateUserProjects(users, projects);
  const tasks = generateTasks(supervisors, employees, projects);
  const comments = generateComments(tasks, supervisors);

  // Ensure mock data directory exists
  console.log(`Ensuring mock data directory exists at ${MOCK_DATA_DIR}...`);
  try {
    await mkdir(MOCK_DATA_DIR, { recursive: true });
    console.log(`Directory ${MOCK_DATA_DIR} created or already exists.`);
  } catch (error) {
    console.error(`Error creating directory ${MOCK_DATA_DIR}:`, error);
    process.exit(1); // Exit if we can't create the directory
  }

  console.log(`Generating mock data in ${MOCK_DATA_DIR}...`);

  await Promise.all([
    Bun.write(
      join(MOCK_DATA_DIR, "users.json"),
      JSON.stringify(users, null, 2),
    ),
    Bun.write(
      join(MOCK_DATA_DIR, "projects.json"),
      JSON.stringify(projects, null, 2),
    ),
    Bun.write(
      join(MOCK_DATA_DIR, "userProjects.json"),
      JSON.stringify(userProjects, null, 2),
    ),
    Bun.write(
      join(MOCK_DATA_DIR, "tasks.json"),
      JSON.stringify(tasks, null, 2),
    ),
    Bun.write(
      join(MOCK_DATA_DIR, "comments.json"),
      JSON.stringify(comments, null, 2),
    ),
  ]);

  console.log("Mock data generation complete.");
}

generate().catch((error) => {
  console.error("Error generating mock data:", error);
  process.exit(1);
});
