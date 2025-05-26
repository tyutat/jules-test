import * as fs from 'fs';
import { Task } from '../models/Task';
import { Task as TaskInterface } from '../interfaces/Task';

const DATA_FILE = './tasks.json';

export class TaskManager {
  private tasks: Task[] = [];
  private nextId: number = 1;

  constructor() {
    this.loadTasks();
  }

  private loadTasks(): void {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
        if (fileContent.trim() === '') {
          this.tasks = [];
          this.nextId = 1;
          console.info('Data file is empty. Initializing with no tasks.');
          return;
        }
        const rawTasks: any[] = JSON.parse(fileContent);
        
        this.tasks = rawTasks.map(rawTask => {
          // Ensure rawTask.id exists and is a string, or generate one if migrating old data
          const id = rawTask.id ? rawTask.id.toString() : (this.nextId++).toString();

          const task = new Task(
            id,
            rawTask.title,
            rawTask.description
          );
          task.completed = rawTask.completed === true; // Ensure boolean
          if (rawTask.dueDate) {
            const parsedDate = new Date(rawTask.dueDate);
            if (!isNaN(parsedDate.getTime())) {
              task.dueDate = parsedDate;
            } else {
              console.warn(`Invalid date format for task ID ${id}: ${rawTask.dueDate}. Due date not set.`);
            }
          }
          return task;
        });

        if (this.tasks.length > 0) {
          const maxId = Math.max(...this.tasks.map(t => {
            const idNum = parseInt(t.id, 10);
            return isNaN(idNum) ? 0 : idNum; // Handle potential NaN if IDs are not purely numeric
          }));
          this.nextId = (isNaN(maxId) || maxId < 1) ? 1 : maxId + 1;
        } else {
          this.nextId = 1;
        }
        console.info(`Tasks loaded successfully from ${DATA_FILE}. Next ID: ${this.nextId}`);
      } else {
        console.info(`Data file ${DATA_FILE} not found. Initializing with no tasks.`);
        this.tasks = [];
        this.nextId = 1;
      }
    } catch (error) {
      console.error(`Error loading tasks from ${DATA_FILE}:`, error);
      this.tasks = [];
      this.nextId = 1;
    }
  }

  private saveTasks(): void {
    try {
      const tasksToSave = this.tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        completed: task.completed,
        dueDate: task.dueDate ? task.dueDate.toISOString() : undefined,
      }));
      fs.writeFileSync(DATA_FILE, JSON.stringify(tasksToSave, null, 2), 'utf-8');
      // console.info(`Tasks saved successfully to ${DATA_FILE}.`);
    } catch (error) {
      console.error(`Error saving tasks to ${DATA_FILE}:`, error);
    }
  }

  addTask(title: string, description?: string, dueDate?: Date): Task {
    // Ensure nextId is correctly determined if tasks were loaded
    if (this.tasks.length === 0 && this.nextId === 1) {
        // If tasks were loaded and it was empty, nextId would be 1.
        // If tasks were loaded and it was not empty, nextId would be maxId + 1.
        // This check is mostly for the initial state or if the file was empty/corrupted.
    } else if (this.tasks.length > 0 && this.nextId <= Math.max(...this.tasks.map(t => parseInt(t.id,10)))){
         this.nextId = Math.max(...this.tasks.map(t => parseInt(t.id, 10))) + 1;
    }


    const id = (this.nextId++).toString();
    const newTask = new Task(id, title, description, dueDate);
    this.tasks.push(newTask);
    this.saveTasks();
    return newTask;
  }

  getTaskById(id: string): Task | undefined {
    return this.tasks.find(task => task.id === id);
  }

  getAllTasks(): Task[] {
    return this.tasks;
  }

  updateTask(id: string, updates: Partial<Pick<TaskInterface, 'title' | 'description' | 'dueDate' | 'completed'>>): Task | undefined {
    const task = this.getTaskById(id);
    if (task) {
      let updated = false;
      if (updates.completed !== undefined && task.completed !== updates.completed) {
        task.toggleCompletion();
        updated = true;
      }

      const detailUpdates: Partial<Pick<TaskInterface, 'title' | 'description' | 'dueDate'>> = {};
      let detailsChanged = false;

      if (updates.hasOwnProperty('title')) {
        if (updates.title !== undefined && updates.title !== task.title) {
          detailUpdates.title = updates.title;
          detailsChanged = true;
        }
      }

      if (updates.hasOwnProperty('description')) {
        if (updates.description !== task.description) {
          detailUpdates.description = updates.description; // Will pass 'undefined' if that's the update
          detailsChanged = true;
        }
      }
      
      if (updates.hasOwnProperty('dueDate')) {
        // Compare actual Date objects or their string representations if both exist
        const currentDueDateMs = task.dueDate?.getTime();
        const newDueDateMs = updates.dueDate?.getTime();

        if (newDueDateMs !== currentDueDateMs) {
            detailUpdates.dueDate = updates.dueDate; // Will pass 'undefined' if that's the update
            detailsChanged = true;
        }
      }

      if (detailsChanged) {
        task.updateDetails(detailUpdates);
        updated = true; // Mark overall 'updated' for saving if details changed
      }
      
      // 'updated' is also true if only completion status changed.
      if (updated) { // if completion changed OR detailsChanged
        this.saveTasks();
      }
      return task;
    }
    return undefined;
  }

  deleteTask(id: string): boolean {
    const initialLength = this.tasks.length;
    this.tasks = this.tasks.filter(task => task.id !== id);
    const deleted = this.tasks.length < initialLength;
    if (deleted) {
      this.saveTasks();
    }
    return deleted;
  }

  getTasksByCompletion(completed: boolean): Task[] {
    return this.tasks.filter(task => task.completed === completed);
  }
}
