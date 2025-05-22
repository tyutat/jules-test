import { Task as TaskInterface } from '../interfaces/Task';

export class Task implements TaskInterface {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: Date;

  constructor(id: string, title: string, description?: string, dueDate?: Date) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.completed = false; // Initialize completed to false
    this.dueDate = dueDate;
  }

  toggleCompletion(): void {
    this.completed = !this.completed;
  }

  updateDetails(details: Partial<Pick<TaskInterface, 'title' | 'description' | 'dueDate'>>): void {
    if (details.title !== undefined) {
      this.title = details.title;
    }
    if (details.description !== undefined) {
      this.description = details.description;
    }
    if (details.dueDate !== undefined) {
      this.dueDate = details.dueDate;
    }
  }
}
