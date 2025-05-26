import { TaskManager } from './services/TaskManager';
import inquirer from 'inquirer';
import { Task } from './models/Task'; // Import Task model for display formatting

// Test comment for pre-commit hook
const taskManager = new TaskManager();

function displayTasks(tasks: Task[], message: string = "Tasks:") {
  if (tasks.length === 0) {
    console.log("No tasks found.");
    return;
  }
  console.log(message);
  tasks.forEach(task => {
    const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A';
    console.log(
      `  ID: ${task.id}, Title: "${task.title}", Completed: ${task.completed ? 'Yes' : 'No'}, Due: ${dueDate}${task.description ? `, Desc: "${task.description}"` : ''}`
    );
  });
}

async function promptForTaskDetails(initialDetails: Partial<Task> = {}): Promise<Partial<Task>> {
  // Define the questions for the first prompt directly:
  const initialQuestions = [
    {
      type: 'input' as const, // Using 'as const' for type literal inference
      name: 'title' as const,
      message: "Task title:",
      default: initialDetails.title,
      validate: (input: string) => input.trim() !== '' || "Title cannot be empty."
    },
    {
      type: 'input' as const,
      name: 'description' as const,
      message: "Task description (optional):",
      default: initialDetails.description
    }
    // The 'dueDate' question is not included here
  ];

  // Pass this directly defined array to the prompt
  const initialAnswers = await inquirer.prompt(initialQuestions);
  let dueDate: Date | undefined = undefined;

  // Ensure title is present, as inquirer.prompt with 'as const' should guarantee it if not optional.
  // However, since 'default' can be undefined and validate might allow empty string if not careful,
  // a runtime check or stricter typing on 'initialAnswers.title' might be needed if title could truly be absent.
  // For now, assuming 'validate' ensures title is non-empty.
  if (initialAnswers.title === undefined || initialAnswers.title.trim() === '') { // Should not happen with current validation
    console.log("Title is missing, cannot proceed.");
    return {}; // Or throw error
  }

  // Loop for due date until valid or skipped
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { dueDateString } = await inquirer.prompt([
      {
        type: 'input',
        name: 'dueDateString',
        message: "Due date (optional, YYYY-MM-DD, press Enter to skip):",
        default: initialDetails.dueDate ? new Date(initialDetails.dueDate).toISOString().split('T')[0] : '',
        validate: (input: string) => {
          if (input.trim() === '') return true; // Allow skipping
          if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) {
            return "Invalid format. Please use YYYY-MM-DD or leave blank to skip.";
          }
          const tempDate = new Date(input);
          if (isNaN(tempDate.getTime())) {
            return "Invalid date (e.g., 2023-02-30). Please enter a valid date or leave blank.";
          }
          // Check if the date string matches the date object's parts to catch things like 2023-02-29 in a non-leap year
          // which JS might parse as March 1st.
          const [year, month, day] = input.split('-').map(Number);
          if (tempDate.getFullYear() !== year || tempDate.getMonth() + 1 !== month || tempDate.getDate() !== day) {
            return "Invalid date (e.g., 2023-02-31). Please enter a valid calendar date or leave blank.";
          }
          return true;
        }
      }
    ]);

    if (dueDateString.trim() === '') {
      dueDate = undefined;
      break;
    }
    // Re-validate after prompt's internal validation, just to be absolutely sure
    // The prompt's validate function should now be robust enough
    const tempDate = new Date(dueDateString);
    // The validation logic in the prompt should now be sufficient.
    // if (isNaN(tempDate.getTime())) {
    //   console.log("Invalid date entered. Please try again or press Enter to skip.");
    // } else {
    dueDate = tempDate;
    break;
    // }
  }

  return { ...initialAnswers, dueDate };
}

async function handleAddTask() {
  console.log("\n--- Add New Task ---");
  const details = await promptForTaskDetails();
  const newTask = taskManager.addTask(details.title!, details.description, details.dueDate);
  console.log(`\nSUCCESS: Task "${newTask.title}" (ID: ${newTask.id}) added.`);
}

async function handleViewAllTasks() {
  console.log("\n--- All Tasks ---");
  const tasks = taskManager.getAllTasks();
  displayTasks(tasks);
}

async function handleViewCompletedTasks() {
  console.log("\n--- Completed Tasks ---");
  const tasks = taskManager.getTasksByCompletion(true);
  displayTasks(tasks, "Completed Tasks:");
}

async function handleViewPendingTasks() {
  console.log("\n--- Pending Tasks ---");
  const tasks = taskManager.getTasksByCompletion(false);
  displayTasks(tasks, "Pending Tasks:");
}

async function promptForTaskId(message: string = "Enter task ID:"): Promise<string | null> {
    const { id } = await inquirer.prompt([{ type: 'input', name: 'id', message }]);
    if (!id.trim()) {
        console.log("No ID entered.");
        return null;
    }
    return id.trim();
}


async function handleMarkTaskCompleted() {
  console.log("\n--- Mark Task as Completed ---");
  const id = await promptForTaskId();
  if (!id) return;

  const task = taskManager.getTaskById(id);
  if (!task) {
    console.log(`ERROR: Task with ID "${id}" not found.`);
    return;
  }
  if (task.completed) {
    console.log(`Task "${task.title}" (ID: ${id}) is already marked as completed.`);
    return;
  }
  const updatedTask = taskManager.updateTask(id, { completed: true });
  if (updatedTask) {
    console.log(`SUCCESS: Task "${updatedTask.title}" (ID: ${id}) marked as completed.`);
  } else {
    // This case should ideally not be reached if getTaskById found the task
    console.log(`ERROR: Could not update task with ID "${id}".`);
  }
}

async function handleUpdateTask() {
  console.log("\n--- Update Task ---");
  const id = await promptForTaskId("Enter ID of task to update:");
  if (!id) return;

  const task = taskManager.getTaskById(id);
  if (!task) {
    console.log(`ERROR: Task with ID "${id}" not found.`);
    return;
  }

  console.log("Current details:", task.title, task.description, task.dueDate);
  const { fieldsToUpdate } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'fieldsToUpdate',
      message: 'Which fields do you want to update?',
      choices: [
        { name: 'Title', value: 'title' },
        { name: 'Description', value: 'description' },
        { name: 'Due Date', value: 'dueDate' },
      ],
    },
  ]);

  if (!fieldsToUpdate || fieldsToUpdate.length === 0) {
    console.log("No fields selected for update.");
    return;
  }

  const newDetails: Partial<Pick<Task, 'title' | 'description' | 'dueDate'>> = {};

  if (fieldsToUpdate.includes('title')) {
    const { title } = await inquirer.prompt([{ type: 'input', name: 'title', message: 'New title:', default: task.title, validate: (input: string) => input.trim() !== '' || "Title cannot be empty." }]);
    newDetails.title = title;
  }
  if (fieldsToUpdate.includes('description')) {
    const { description } = await inquirer.prompt([{ type: 'input', name: 'description', message: 'New description:', default: task.description }]);
    newDetails.description = description;
  }
  if (fieldsToUpdate.includes('dueDate')) {
    // Loop for due date until valid or skipped for update
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { dueDateStr } = await inquirer.prompt([{
        type: 'input',
        name: 'dueDateStr',
        message: 'New due date (YYYY-MM-DD, leave blank to remove):',
        default: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        validate: (input: string) => {
          if (input.trim() === '') return true; // Allow skipping/removing
          if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) {
            return "Invalid format. Please use YYYY-MM-DD or leave blank.";
          }
          const tempDate = new Date(input);
          if (isNaN(tempDate.getTime())) {
            return "Invalid date (e.g., 2023-02-30). Please enter a valid date or leave blank.";
          }
          const [year, month, day] = input.split('-').map(Number);
          if (tempDate.getFullYear() !== year || tempDate.getMonth() + 1 !== month || tempDate.getDate() !== day) {
            return "Invalid date (e.g., 2023-02-31). Please enter a valid calendar date or leave blank.";
          }
          return true;
        }
      }]);

      if (dueDateStr.trim() === '') {
        newDetails.dueDate = undefined; // Explicitly set to undefined if blank
        break;
      }
      // The prompt's validate function should now be robust enough
      newDetails.dueDate = new Date(dueDateStr);
      break;
    }
  }

  if (Object.keys(newDetails).length > 0) {
    const updatedTask = taskManager.updateTask(id, newDetails);
    if (updatedTask) {
      console.log(`SUCCESS: Task "${updatedTask.title}" (ID: ${id}) updated.`);
    } else {
      console.log(`ERROR: Could not update task with ID "${id}".`); // Should not happen if task was found
    }
  } else {
    console.log("No changes were made.");
  }
}

async function handleDeleteTask() {
  console.log("\n--- Delete Task ---");
  const id = await promptForTaskId("Enter ID of task to delete:");
  if (!id) return;

  const taskToDelete = taskManager.getTaskById(id);
  if (!taskToDelete) {
      console.log(`ERROR: Task with ID "${id}" not found.`);
      return;
  }

  const deleted = taskManager.deleteTask(id);
  if (deleted) {
    console.log(`SUCCESS: Task "${taskToDelete.title}" (ID: ${id}) deleted.`);
  } else {
    console.log(`ERROR: Task with ID "${id}" not found or could not be deleted.`); // Should not happen if task was found
  }
}

async function mainMenu() {
  console.log("\n--- Task Manager CLI ---");
  let running = true;
  while (running) {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          'Add a new task',
          'View all tasks',
          'View completed tasks',
          'View pending tasks',
          'Mark a task as completed',
          'Update a task',
          'Delete a task',
          new inquirer.Separator(),
          'Exit',
        ],
      },
    ]);

    switch (action) {
      case 'Add a new task':
        await handleAddTask();
        break;
      case 'View all tasks':
        await handleViewAllTasks();
        break;
      case 'View completed tasks':
        await handleViewCompletedTasks();
        break;
      case 'View pending tasks':
        await handleViewPendingTasks();
        break;
      case 'Mark a task as completed':
        await handleMarkTaskCompleted();
        break;
      case 'Update a task':
        await handleUpdateTask();
        break;
      case 'Delete a task':
        await handleDeleteTask();
        break;
      case 'Exit':
        running = false;
        console.log("\nExiting Task Manager. Goodbye!");
        break;
    }
    if (running) {
        await inquirer.prompt([{type: 'input', name: 'continue', message: '\nPress Enter to return to the menu...', default:''}]);
    }
  }
}

mainMenu().catch(error => {
  console.error("An unexpected error occurred:", error);
});
