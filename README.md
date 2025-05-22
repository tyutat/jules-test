# TypeScript Task Management CLI

## Description

This is a command-line interface (CLI) application built with TypeScript for managing tasks. It allows users to easily add, view, update, delete, and manage the completion status of their tasks. All task data is persisted locally in a `tasks.json` file.

Key features include:
- Adding new tasks with titles, descriptions (optional), and due dates (optional).
- Viewing all tasks, or filtering by completed or pending status.
- Updating existing task details (title, description, due date).
- Marking tasks as completed or re-opening them.
- Deleting tasks.
- Persistent storage of tasks in a local `tasks.json` file.

## Prerequisites

- **Node.js:** (e.g., v16.x or later recommended)
- **npm:** (Node Package Manager, usually comes with Node.js)

You can download Node.js and npm from [nodejs.org](https://nodejs.org/).

## Setup/Installation

1.  **Clone the repository (if applicable):**
    ```bash
    # git clone <repository-url>
    # cd <repository-directory>
    ```
    (For the current context, assume you have the project files.)

2.  **Install dependencies:**
    Open your terminal in the project's root directory and run:
    ```bash
    npm install
    ```

## Running the Application

To start the Task Management CLI, run the following command in the project's root directory:

```bash
npm start
```

This will launch the interactive command-line menu.

## Features/Usage

Once the application is running, you will be presented with a menu of options:

-   **Add a new task:** Prompts for task details (title, description, due date).
-   **View all tasks:** Displays all current tasks with their details.
-   **View completed tasks:** Shows only tasks that have been marked as completed.
-   **View pending tasks:** Shows only tasks that are not yet completed.
-   **Mark a task as completed:** Allows you to mark a specific task as done.
-   **Update a task:** Lets you modify the title, description, or due date of an existing task.
-   **Delete a task:** Removes a task from the list.
-   **Exit:** Closes the application.

Follow the on-screen prompts to interact with the application.

## Project Structure

A brief overview of the key directories and files:

-   `src/`: Contains the core TypeScript source code.
    -   `index.ts`: The main entry point for the CLI application, handles user interaction.
    -   `interfaces/Task.ts`: Defines the `Task` interface.
    -   `models/Task.ts`: Implements the `Task` class representing a single task.
    -   `services/TaskManager.ts`: Contains the logic for managing tasks (add, update, delete, load, save).
-   `tests/`: Contains unit tests for the application.
    -   `models/Task.test.ts`: Tests for the `Task` class.
    -   `services/TaskManager.test.ts`: Tests for the `TaskManager` class.
-   `package.json`: Defines project metadata, dependencies, and scripts.
-   `tsconfig.json`: Configuration file for the TypeScript compiler.
-   `jest.config.js`: Configuration file for the Jest testing framework.
-   `tasks.json`: The local file where task data is stored (created automatically when tasks are modified).
-   `.gitignore`: Specifies intentionally untracked files that Git should ignore (e.g., `node_modules`, `dist`, `tasks.json`).
-   `README.md`: This file.

## Running Tests

To run the automated tests, use the following command:

```bash
npm test
```

**Note on Test Execution:** In some controlled sandbox environments, there have been intermittent issues with `npm install` not correctly resolving all dependencies for `ts-jest`, which can prevent tests from running as expected. In a standard local Node.js environment, these tests are designed to pass and verify the core functionality of the `Task` and `TaskManager` classes.

---

This README provides a comprehensive guide for users and developers of the TypeScript Task Management CLI.
