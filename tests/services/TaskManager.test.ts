import { TaskManager } from '../../src/services/TaskManager';
import { Task } from '../../src/models/Task';
import { Task as TaskInterface } from '../../src/interfaces/Task';

describe('TaskManager', () => {
  let taskManager: TaskManager;

  beforeEach(() => {
    taskManager = new TaskManager();
  });

  describe('addTask', () => {
    test('should add a new task and return it with a generated ID', () => {
      const title = 'New Task';
      const description = 'New Description';
      const dueDate = new Date('2024-01-01');
      const task = taskManager.addTask(title, description, dueDate);

      expect(task).toBeInstanceOf(Task);
      expect(task.id).toBe('1'); // First ID
      expect(task.title).toBe(title);
      expect(task.description).toBe(description);
      expect(task.dueDate).toEqual(dueDate);
      expect(task.completed).toBe(false);
      expect(taskManager.getAllTasks()).toHaveLength(1);
      expect(taskManager.getAllTasks()[0]).toBe(task);
    });

    test('should increment nextId for subsequent tasks', () => {
      taskManager.addTask('Task 1');
      const task2 = taskManager.addTask('Task 2');
      expect(task2.id).toBe('2');
      const task3 = taskManager.addTask('Task 3');
      expect(task3.id).toBe('3');
    });

    test('should correctly add tasks with only title', () => {
      const title = "Title Only Task";
      const task = taskManager.addTask(title);
      expect(task.title).toBe(title);
      expect(task.description).toBeUndefined();
      expect(task.dueDate).toBeUndefined();
    });
  });

  describe('getAllTasks', () => {
    test('should return an empty array initially', () => {
      expect(taskManager.getAllTasks()).toEqual([]);
    });

    test('should return all added tasks', () => {
      const task1 = taskManager.addTask('Task 1');
      const task2 = taskManager.addTask('Task 2');
      expect(taskManager.getAllTasks()).toEqual([task1, task2]);
      expect(taskManager.getAllTasks()).toHaveLength(2);
    });
  });

  describe('getTaskById', () => {
    test('should return the correct task if ID exists', () => {
      const task1 = taskManager.addTask('Task 1');
      const foundTask = taskManager.getTaskById(task1.id);
      expect(foundTask).toBe(task1);
    });

    test('should return undefined if ID does not exist', () => {
      taskManager.addTask('Task 1');
      const foundTask = taskManager.getTaskById('nonexistent-id');
      expect(foundTask).toBeUndefined();
    });
  });

  describe('updateTask', () => {
    let task: Task;

    beforeEach(() => {
      task = taskManager.addTask('Original Title', 'Original Description', new Date('2023-01-01'));
    });

    test('should update title, description, and dueDate of an existing task', () => {
      const updates: Partial<Pick<TaskInterface, 'title' | 'description' | 'dueDate'>> = {
        title: 'Updated Title',
        description: 'Updated Description',
        dueDate: new Date('2024-02-02'),
      };
      const updatedTask = taskManager.updateTask(task.id, updates);

      expect(updatedTask).toBeDefined();
      expect(updatedTask?.title).toBe(updates.title);
      expect(updatedTask?.description).toBe(updates.description);
      expect(updatedTask?.dueDate).toEqual(updates.dueDate);
      expect(updatedTask?.completed).toBe(false); // Original completion status
    });

    test('should mark a task as completed', () => {
      expect(task.completed).toBe(false);
      const updatedTask = taskManager.updateTask(task.id, { completed: true });
      expect(updatedTask).toBeDefined();
      expect(updatedTask?.completed).toBe(true);
    });

    test('should mark a completed task as not completed', () => {
      taskManager.updateTask(task.id, { completed: true }); // Mark as completed first
      const updatedTask = taskManager.updateTask(task.id, { completed: false });
      expect(updatedTask).toBeDefined();
      expect(updatedTask?.completed).toBe(false);
    });
    
    test('should update only title and keep other fields same', () => {
      const newTitle = "Only Title Updated";
      const updatedTask = taskManager.updateTask(task.id, { title: newTitle });
      expect(updatedTask?.title).toBe(newTitle);
      expect(updatedTask?.description).toBe('Original Description');
      expect(updatedTask?.dueDate).toEqual(new Date('2023-01-01'));
      expect(updatedTask?.completed).toBe(false);
    });

    test('should update description to be undefined', () => {
      const updatedTask = taskManager.updateTask(task.id, { description: undefined });
      expect(updatedTask?.description).toBeUndefined();
    });
    
    test('should update dueDate to be undefined', () => {
      const updatedTask = taskManager.updateTask(task.id, { dueDate: undefined });
      expect(updatedTask?.dueDate).toBeUndefined();
    });

    test('should allow updating completion status and other details simultaneously', () => {
      const updates: Partial<Pick<TaskInterface, 'title' | 'description' | 'dueDate' | 'completed'>> = {
        title: 'Simultaneous Update',
        completed: true,
      };
      const updatedTask = taskManager.updateTask(task.id, updates);
      expect(updatedTask?.title).toBe('Simultaneous Update');
      expect(updatedTask?.completed).toBe(true);
      expect(updatedTask?.description).toBe('Original Description'); // Unchanged
    });

    test('should return the updated task', () => {
      const updatedTask = taskManager.updateTask(task.id, { title: 'New Title' });
      expect(updatedTask).toBeInstanceOf(Task);
      expect(updatedTask?.id).toBe(task.id);
    });

    test('should return undefined if task ID does not exist', () => {
      const updatedTask = taskManager.updateTask('nonexistent-id', { title: 'New Title' });
      expect(updatedTask).toBeUndefined();
    });
    
    test('should not change other tasks when one task is updated', () => {
      const task2 = taskManager.addTask('Another Task');
      taskManager.updateTask(task.id, { title: 'Updated First Task' });

      const retrievedTask2 = taskManager.getTaskById(task2.id);
      expect(retrievedTask2?.title).toBe('Another Task'); // task2 should be unchanged
    });
  });

  describe('deleteTask', () => {
    let task1: Task;
    let task2: Task;

    beforeEach(() => {
      task1 = taskManager.addTask('Task 1 to delete');
      task2 = taskManager.addTask('Task 2 to keep');
    });

    test('should remove a task from the list and return true', () => {
      const result = taskManager.deleteTask(task1.id);
      expect(result).toBe(true);
      expect(taskManager.getTaskById(task1.id)).toBeUndefined();
      expect(taskManager.getAllTasks()).toHaveLength(1);
    });

    test('should return false if task ID does not exist', () => {
      const result = taskManager.deleteTask('nonexistent-id');
      expect(result).toBe(false);
      expect(taskManager.getAllTasks()).toHaveLength(2); // No change
    });

    test('should ensure other tasks remain unaffected after deletion', () => {
      taskManager.deleteTask(task1.id);
      const remainingTask = taskManager.getTaskById(task2.id);
      expect(remainingTask).toBe(task2);
      expect(taskManager.getAllTasks()).toEqual([task2]);
    });
  });

  describe('getTasksByCompletion', () => {
    beforeEach(() => {
      const task1 = taskManager.addTask('Completed Task 1');
      taskManager.updateTask(task1.id, { completed: true });

      taskManager.addTask('Pending Task 1');

      const task3 = taskManager.addTask('Completed Task 2');
      taskManager.updateTask(task3.id, { completed: true });

      taskManager.addTask('Pending Task 2');
    });

    test('should return only completed tasks when true is passed', () => {
      const completedTasks = taskManager.getTasksByCompletion(true);
      expect(completedTasks).toHaveLength(2);
      expect(completedTasks.every(task => task.completed)).toBe(true);
      expect(completedTasks.map(t => t.title)).toContain('Completed Task 1');
      expect(completedTasks.map(t => t.title)).toContain('Completed Task 2');
    });

    test('should return only pending tasks when false is passed', () => {
      const pendingTasks = taskManager.getTasksByCompletion(false);
      expect(pendingTasks).toHaveLength(2);
      expect(pendingTasks.every(task => !task.completed)).toBe(true);
      expect(pendingTasks.map(t => t.title)).toContain('Pending Task 1');
      expect(pendingTasks.map(t => t.title)).toContain('Pending Task 2');
    });

    test('should return an empty array if no tasks match the criteria (all pending, ask for completed)', () => {
      const newManager = new TaskManager();
      newManager.addTask('Pending Only 1');
      newManager.addTask('Pending Only 2');
      const completedTasks = newManager.getTasksByCompletion(true);
      expect(completedTasks).toEqual([]);
    });

    test('should return an empty array if no tasks match the criteria (all completed, ask for pending)', () => {
      const newManager = new TaskManager();
      const t1 = newManager.addTask('Completed Only 1');
      newManager.updateTask(t1.id, {completed: true});
      const t2 = newManager.addTask('Completed Only 2');
      newManager.updateTask(t2.id, {completed: true});
      const pendingTasks = newManager.getTasksByCompletion(false);
      expect(pendingTasks).toEqual([]);
    });
    
    test('should return an empty array if there are no tasks at all', () => {
        const newManager = new TaskManager();
        expect(newManager.getTasksByCompletion(true)).toEqual([]);
        expect(newManager.getTasksByCompletion(false)).toEqual([]);
    });
  });
});
