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
    if (details.hasOwnProperty('title')) {
      // Ensure title is not empty string if provided, otherwise keep original
      if (details.title !== undefined && details.title.trim() === '') {
        // Or throw an error, or handle as per requirements for empty titles during update
        // For now, let's assume an empty title means "don't update if it makes it empty"
        // This part might need refinement based on actual product requirements for updating to empty title.
        // However, the original test only checks for undefined, not empty string.
        // For now, let's stick to the original logic for title: if it's undefined, don't change. If it's a string, change.
      }
      // Reverting to simpler logic for title as per existing tests:
      if (details.title !== undefined) {
           this.title = details.title;
      }
    }
    if (details.hasOwnProperty('description')) {
      this.description = details.description;
    }
    if (details.hasOwnProperty('dueDate')) {
      this.dueDate = details.dueDate;
    }
  }
}
