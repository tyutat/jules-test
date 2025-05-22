import { Task } from '../../src/models/Task';

describe('Task', () => {
  const taskData = {
    id: '1',
    title: 'Test Task',
    description: 'Test Description',
    dueDate: new Date('2024-12-31'),
  };

  test('constructor should correctly initialize properties and default completed to false', () => {
    const task = new Task(taskData.id, taskData.title, taskData.description, taskData.dueDate);
    expect(task.id).toBe(taskData.id);
    expect(task.title).toBe(taskData.title);
    expect(task.description).toBe(taskData.description);
    expect(task.dueDate).toEqual(taskData.dueDate);
    expect(task.completed).toBe(false);
  });

  test('constructor should handle optional description and dueDate', () => {
    const task = new Task('2', 'Minimal Task');
    expect(task.id).toBe('2');
    expect(task.title).toBe('Minimal Task');
    expect(task.description).toBeUndefined();
    expect(task.dueDate).toBeUndefined();
    expect(task.completed).toBe(false);
  });

  describe('toggleCompletion', () => {
    test('should toggle completed from false to true', () => {
      const task = new Task('1', 'Test');
      expect(task.completed).toBe(false);
      task.toggleCompletion();
      expect(task.completed).toBe(true);
    });

    test('should toggle completed from true to false', () => {
      const task = new Task('1', 'Test');
      task.toggleCompletion(); // false -> true
      expect(task.completed).toBe(true);
      task.toggleCompletion(); // true -> false
      expect(task.completed).toBe(false);
    });
  });

  describe('updateDetails', () => {
    let task: Task;

    beforeEach(() => {
      task = new Task(taskData.id, taskData.title, taskData.description, taskData.dueDate);
    });

    test('should update title only', () => {
      const newTitle = 'Updated Title';
      task.updateDetails({ title: newTitle });
      expect(task.title).toBe(newTitle);
      expect(task.description).toBe(taskData.description);
      expect(task.dueDate).toEqual(taskData.dueDate);
    });

    test('should update description only', () => {
      const newDescription = 'Updated Description';
      task.updateDetails({ description: newDescription });
      expect(task.title).toBe(taskData.title);
      expect(task.description).toBe(newDescription);
      expect(task.dueDate).toEqual(taskData.dueDate);
    });

    test('should update dueDate only', () => {
      const newDueDate = new Date('2025-01-15');
      task.updateDetails({ dueDate: newDueDate });
      expect(task.title).toBe(taskData.title);
      expect(task.description).toBe(taskData.description);
      expect(task.dueDate).toEqual(newDueDate);
    });
    
    test('should update an undefined dueDate', () => {
      const taskWithoutDueDate = new Task('3', 'No Due Date Task');
      const newDueDate = new Date('2025-02-20');
      taskWithoutDueDate.updateDetails({ dueDate: newDueDate });
      expect(taskWithoutDueDate.dueDate).toEqual(newDueDate);
    });

    test('should update multiple properties at once', () => {
      const newTitle = 'Multi Update Title';
      const newDescription = 'Multi Update Description';
      const newDueDate = new Date('2025-03-10');
      task.updateDetails({ title: newTitle, description: newDescription, dueDate: newDueDate });
      expect(task.title).toBe(newTitle);
      expect(task.description).toBe(newDescription);
      expect(task.dueDate).toEqual(newDueDate);
    });

    test('should not change id or completed status', () => {
      const originalId = task.id;
      const originalCompleted = task.completed;
      task.updateDetails({ title: 'Another Update' });
      expect(task.id).toBe(originalId);
      expect(task.completed).toBe(originalCompleted);
    });

    test('should allow description to be updated to an empty string', () => {
        task.updateDetails({ description: '' });
        expect(task.description).toBe('');
    });

    test('should allow description to be updated to undefined', () => {
        task.updateDetails({ description: undefined });
        expect(task.description).toBeUndefined();
    });
    
    test('should allow dueDate to be updated to undefined', () => {
        task.updateDetails({ dueDate: undefined });
        expect(task.dueDate).toBeUndefined();
    });
  });
});
