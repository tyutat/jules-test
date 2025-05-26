import * as fs from 'fs';
import { TaskManager } from '../../src/services/TaskManager';
import { Task } from '../../src/models/Task';
import { Task as TaskInterface } from '../../src/interfaces/Task';

jest.mock('fs'); // Mock the entire fs module
jest.spyOn(console, 'info').mockImplementation(() => {}); // Suppress console.info
jest.spyOn(console, 'warn').mockImplementation(() => {}); // Suppress console.warn
jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console.error for expected errors if any

describe('TaskManager', () => {
  let taskManager: TaskManager;
  const mockDataFile = './tasks.json'; // Path used by TaskManager

  beforeEach(() => {
    // Reset mocks for each test to ensure isolation
    (fs.existsSync as jest.Mock).mockReset();
    (fs.readFileSync as jest.Mock).mockReset();
    (fs.writeFileSync as jest.Mock).mockReset();
    (console.info as jest.Mock).mockClear(); // Clear console spies
    (console.warn as jest.Mock).mockClear();
    (console.error as jest.Mock).mockClear();


    // Default mock implementations (can be overridden in specific tests)
    // Simulates an empty or non-existent tasks.json file by default for a clean slate
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.readFileSync as jest.Mock).mockReturnValue("[]"); // Default to empty tasks array if read
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {}); // Default to do nothing for write

    // Instantiate TaskManager AFTER setting up mocks for the constructor's loadTasks()
    taskManager = new TaskManager();
  });

  describe('addTask', () => {
    test('should add a new task, save it, and return it with a generated ID', () => {
      const title = 'New Task';
      const description = 'New Description';
      const dueDate = new Date('2024-01-01');
      
      const task = taskManager.addTask(title, description, dueDate);

      expect(task).toBeInstanceOf(Task);
      expect(task.id).toBe('1'); // First ID after clean load
      expect(task.title).toBe(title);
      expect(task.description).toBe(description);
      expect(task.dueDate).toEqual(dueDate);
      expect(task.completed).toBe(false);
      
      const tasks = taskManager.getAllTasks();
      expect(tasks).toHaveLength(1);
      expect(tasks[0]).toBe(task);

      expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        mockDataFile,
        JSON.stringify([{
          id: task.id,
          title: task.title,
          description: task.description,
          completed: task.completed,
          dueDate: task.dueDate.toISOString(), // TaskManager saves dates as ISO strings
        }], null, 2),
        'utf-8'
      );
    });

    test('should increment nextId for subsequent tasks with clean load', () => {
      // First task
      taskManager.addTask('Task 1'); 
      // Second task
      const task2 = taskManager.addTask('Task 2');
      expect(task2.id).toBe('2');
      // Third task
      const task3 = taskManager.addTask('Task 3');
      expect(task3.id).toBe('3');

      expect(fs.writeFileSync).toHaveBeenCalledTimes(3); // Called for each addTask
    });

    test('should correctly add tasks with only title and save', () => {
      const title = "Title Only Task";
      const task = taskManager.addTask(title);
      expect(task.title).toBe(title);
      expect(task.description).toBeUndefined();
      expect(task.dueDate).toBeUndefined();
      expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        mockDataFile,
        expect.stringContaining(title), // Basic check for content
        'utf-8'
      );
    });
  });

  describe('getAllTasks', () => {
    test('should return an empty array initially when file does not exist or is empty', () => {
      // Default beforeEach setup: existsSync returns false, readFileSync returns "[]"
      // So TaskManager is initialized with no tasks
      expect(taskManager.getAllTasks()).toEqual([]);
    });

    test('should return all added tasks after starting empty', () => {
      const task1 = taskManager.addTask('Task 1');
      const task2 = taskManager.addTask('Task 2');
      const tasks = taskManager.getAllTasks();
      expect(tasks).toEqual([task1, task2]);
      expect(tasks).toHaveLength(2);
    });
  });

  describe('getTaskById', () => {
    test('should return the correct task if ID exists after adding it', () => {
      const task1 = taskManager.addTask('Task 1');
      const foundTask = taskManager.getTaskById(task1.id);
      expect(foundTask).toBe(task1);
    });

    test('should return undefined if ID does not exist after adding some tasks', () => {
      taskManager.addTask('Task 1');
      const foundTask = taskManager.getTaskById('nonexistent-id');
      expect(foundTask).toBeUndefined();
    });
  });

  describe('updateTask', () => {
    let task: Task;

    beforeEach(() => {
      // Each test in this suite will start with one task, added to a fresh TaskManager
      // This ensures 'task.id' will be '1' for these sub-tests
      (fs.existsSync as jest.Mock).mockReturnValue(false); // Start fresh
      (fs.readFileSync as jest.Mock).mockReturnValue("[]");
      taskManager = new TaskManager(); // Re-initialize to ensure it's clean based on mocks
      task = taskManager.addTask('Original Title', 'Original Description', new Date('2023-01-01T00:00:00.000Z'));
      // Reset writeFileSync mock after this initial addTask in beforeEach
      (fs.writeFileSync as jest.Mock).mockClear();
    });

    test('should update title, description, and dueDate of an existing task and save', () => {
      const updates: Partial<TaskInterface> = { // Use TaskInterface for updates type
        title: 'Updated Title',
        description: 'Updated Description',
        dueDate: new Date('2024-02-02T00:00:00.000Z'),
      };
      const updatedTask = taskManager.updateTask(task.id, updates); // task.id is '1'

      expect(updatedTask).toBeDefined();
      expect(updatedTask?.title).toBe(updates.title);
      expect(updatedTask?.description).toBe(updates.description);
      expect(updatedTask?.dueDate).toEqual(updates.dueDate);
      expect(updatedTask?.completed).toBe(false);
      expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    });

    test('should mark a task as completed and save', () => {
      expect(task.completed).toBe(false);
      const updatedTask = taskManager.updateTask(task.id, { completed: true });
      expect(updatedTask?.completed).toBe(true);
      expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    });

    test('should mark a completed task as not completed and save', () => {
      taskManager.updateTask(task.id, { completed: true }); // Mark as completed
      (fs.writeFileSync as jest.Mock).mockClear(); // Clear after first update
      
      const updatedTask = taskManager.updateTask(task.id, { completed: false });
      expect(updatedTask?.completed).toBe(false);
      expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    });
    
    test('should update only title and keep other fields same, then save', () => {
      const newTitle = "Only Title Updated";
      const updatedTask = taskManager.updateTask(task.id, { title: newTitle });
      expect(updatedTask?.title).toBe(newTitle);
      expect(updatedTask?.description).toBe('Original Description'); // from beforeEach task
      expect(updatedTask?.dueDate).toEqual(new Date('2023-01-01T00:00:00.000Z'));
      expect(updatedTask?.completed).toBe(false);
      expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    });

    test('should update description to be undefined and save', () => {
      const updatedTask = taskManager.updateTask(task.id, { description: undefined });
      // This relies on Task.updateDetails correctly setting description to undefined
      expect(updatedTask?.description).toBeUndefined(); 
      expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    });
    
    test('should update dueDate to be undefined and save', () => {
      const updatedTask = taskManager.updateTask(task.id, { dueDate: undefined });
      // This relies on Task.updateDetails correctly setting dueDate to undefined
      expect(updatedTask?.dueDate).toBeUndefined();
      expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    });

    test('should allow updating completion status and other details simultaneously and save', () => {
      const updates: Partial<TaskInterface> = {
        title: 'Simultaneous Update',
        completed: true,
      };
      const updatedTask = taskManager.updateTask(task.id, updates);
      expect(updatedTask?.title).toBe('Simultaneous Update');
      expect(updatedTask?.completed).toBe(true);
      expect(updatedTask?.description).toBe('Original Description'); // Unchanged from beforeEach
      expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    });

    test('should return the updated task instance', () => {
      const updatedTask = taskManager.updateTask(task.id, { title: 'New Title' });
      expect(updatedTask).toBeInstanceOf(Task);
      expect(updatedTask?.id).toBe(task.id);
    });

    test('should return undefined if task ID does not exist and not save', () => {
      const updatedTask = taskManager.updateTask('nonexistent-id', { title: 'New Title' });
      expect(updatedTask).toBeUndefined();
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
    
    test('should not change other tasks when one task is updated', () => {
      // Add a second task
      const task2 = taskManager.addTask('Another Task');
      (fs.writeFileSync as jest.Mock).mockClear(); // Clear after adding task2

      // Update the first task (from beforeEach)
      taskManager.updateTask(task.id, { title: 'Updated First Task' });

      const retrievedTask2 = taskManager.getTaskById(task2.id);
      expect(retrievedTask2?.title).toBe('Another Task'); // task2 should be unchanged
      expect(fs.writeFileSync).toHaveBeenCalledTimes(1); // Only for the update of task1
    });
  });

  describe('deleteTask', () => {
    let task1: Task;
    let task2: Task;

    beforeEach(() => {
      // Start fresh for each delete test
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (fs.readFileSync as jest.Mock).mockReturnValue("[]");
      taskManager = new TaskManager();
      task1 = taskManager.addTask('Task 1 to delete');
      task2 = taskManager.addTask('Task 2 to keep');
      // Clear writeFileSync mock after these initial adds
      (fs.writeFileSync as jest.Mock).mockClear();
    });

    test('should remove a task from the list, save, and return true', () => {
      const result = taskManager.deleteTask(task1.id);
      expect(result).toBe(true);
      expect(taskManager.getTaskById(task1.id)).toBeUndefined();
      expect(taskManager.getAllTasks()).toHaveLength(1);
      expect(taskManager.getAllTasks()[0]).toBe(task2);
      expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    });

    test('should return false if task ID does not exist and not save', () => {
      const result = taskManager.deleteTask('nonexistent-id');
      expect(result).toBe(false);
      expect(taskManager.getAllTasks()).toHaveLength(2); // No change
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    test('should ensure other tasks remain unaffected after deletion', () => {
      taskManager.deleteTask(task1.id); // task1 is deleted and saved
      const remainingTask = taskManager.getTaskById(task2.id);
      expect(remainingTask).toBe(task2);
      expect(taskManager.getAllTasks()).toEqual([task2]);
      expect(fs.writeFileSync).toHaveBeenCalledTimes(1); // For the deletion of task1
    });
  });

  describe('getTasksByCompletion', () => {
    beforeEach(() => {
      // Start fresh for each completion status test
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (fs.readFileSync as jest.Mock).mockReturnValue("[]");
      taskManager = new TaskManager();

      const taskA = taskManager.addTask('Completed Task 1');
      taskManager.updateTask(taskA.id, { completed: true });

      taskManager.addTask('Pending Task 1');

      const taskC = taskManager.addTask('Completed Task 2');
      taskManager.updateTask(taskC.id, { completed: true });

      taskManager.addTask('Pending Task 2');
      // Clear writeFileSync mock after these initial setups
      (fs.writeFileSync as jest.Mock).mockClear();
    });

    test('should return only completed tasks when true is passed', () => {
      const completedTasks = taskManager.getTasksByCompletion(true);
      expect(completedTasks).toHaveLength(2);
      expect(completedTasks.every(task => task.completed)).toBe(true);
      expect(completedTasks.map(t => t.title)).toEqual(expect.arrayContaining(['Completed Task 1', 'Completed Task 2']));
    });

    test('should return only pending tasks when false is passed', () => {
      const pendingTasks = taskManager.getTasksByCompletion(false);
      expect(pendingTasks).toHaveLength(2);
      expect(pendingTasks.every(task => !task.completed)).toBe(true);
      expect(pendingTasks.map(t => t.title)).toEqual(expect.arrayContaining(['Pending Task 1', 'Pending Task 2']));
    });

    test('should return an empty array if no tasks match the criteria (all pending, ask for completed)', () => {
      // New manager, only pending tasks
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (fs.readFileSync as jest.Mock).mockReturnValue("[]");
      const newManager = new TaskManager();
      newManager.addTask('Pending Only 1');
      newManager.addTask('Pending Only 2');
      const completed = newManager.getTasksByCompletion(true);
      expect(completed).toEqual([]);
    });

    test('should return an empty array if no tasks match the criteria (all completed, ask for pending)', () => {
      // New manager, only completed tasks
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (fs.readFileSync as jest.Mock).mockReturnValue("[]");
      const newManager = new TaskManager();
      const t1 = newManager.addTask('Completed Only 1');
      newManager.updateTask(t1.id, {completed: true});
      const t2 = newManager.addTask('Completed Only 2');
      newManager.updateTask(t2.id, {completed: true});
      const pending = newManager.getTasksByCompletion(false);
      expect(pending).toEqual([]);
    });
    
    test('should return an empty array if there are no tasks at all (fresh manager)', () => {
        (fs.existsSync as jest.Mock).mockReturnValue(false);
        (fs.readFileSync as jest.Mock).mockReturnValue("[]");
        const newManager = new TaskManager(); // Fresh manager based on mocks
        expect(newManager.getTasksByCompletion(true)).toEqual([]);
        expect(newManager.getTasksByCompletion(false)).toEqual([]);
    });
  });

  // Tests for loadTasks behavior with mocked fs
  describe('TaskManager loading behavior', () => {
    test('should load tasks correctly when data file exists and is valid', () => {
      const tasksToLoad = [
        { id: '101', title: 'Loaded Task 1', description: 'Desc 1', completed: true, dueDate: new Date().toISOString() },
        { id: '102', title: 'Loaded Task 2', completed: false }
      ];
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(tasksToLoad));

      const manager = new TaskManager(); // Should call loadTasks in constructor
      const allTasks = manager.getAllTasks();
      expect(allTasks).toHaveLength(2);
      expect(allTasks[0].title).toBe('Loaded Task 1');
      expect(allTasks[0].completed).toBe(true);
      expect(allTasks[1].id).toBe('102');
      // Check that nextId is set correctly
      const nextTask = manager.addTask('Next task');
      expect(parseInt(nextTask.id)).toBeGreaterThanOrEqual(103);
    });

    test('should handle empty data file correctly', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(""); // Empty file content

      const manager = new TaskManager();
      expect(manager.getAllTasks()).toHaveLength(0);
      const task = manager.addTask("First task");
      expect(task.id).toBe("1"); // Should start from 1
      expect(console.info).toHaveBeenCalledWith('Data file is empty. Initializing with no tasks.');
    });
    
    test('should handle corrupt JSON in data file', () => {
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.readFileSync as jest.Mock).mockReturnValue("{corrupt_json_,,}");

        const manager = new TaskManager();
        expect(manager.getAllTasks()).toHaveLength(0);
        const task = manager.addTask("First after corrupt");
        expect(task.id).toBe("1");
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining(`Error loading tasks from ${mockDataFile}:`), expect.any(Error));
    });

    test('should handle tasks with invalid date format during load', () => {
        const tasksWithInvalidDate = [
            { id: '1', title: 'Valid Date Task', dueDate: new Date().toISOString() },
            { id: '2', title: 'Invalid Date Task', dueDate: 'not-a-date-string' },
            { id: '3', title: 'Missing Date Task' }
        ];
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(tasksWithInvalidDate));
        
        const manager = new TaskManager();
        const tasks = manager.getAllTasks();
        expect(tasks).toHaveLength(3);
        expect(tasks[0].dueDate).toBeInstanceOf(Date);
        expect(tasks[1].dueDate).toBeUndefined(); // Invalid date should result in undefined
        expect(tasks[2].dueDate).toBeUndefined();
        expect(console.warn).toHaveBeenCalledWith("Invalid date format for task ID 2: not-a-date-string. Due date not set.");
    });

    test('should correctly calculate nextId when loading tasks with non-numeric or missing IDs', () => {
        const tasksWithMixedIds = [
            { id: '1', title: 'Task 1' },
            { id: 'alpha', title: 'Task Alpha' }, // Non-numeric
            { title: 'Task No ID' },             // Missing ID
            { id: '5', title: 'Task 5' }
        ];
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(tasksWithMixedIds));

        const manager = new TaskManager();
        const loadedTasks = manager.getAllTasks();
        expect(loadedTasks.find(t => t.title === 'Task Alpha')?.id).toBe('alpha'); // Keeps original non-numeric
        expect(loadedTasks.find(t => t.title === 'Task No ID')?.id).toBeDefined(); // Should get a new numeric ID

        const newTask = manager.addTask("A new task");
        // Max numeric ID was 5. Next ID generated by TaskManager for "Task No ID" could be 2 (if "alpha" is ignored by parseInt)
        // or 6 if "alpha" is treated as 0 by parseInt.
        // Then, the addTask for "A new task" should be after that.
        // The exact ID depends on the implementation details of nextId calculation when non-numeric IDs are present.
        // The key is that it's greater than the max *numeric* ID encountered.
        expect(parseInt(newTask.id)).toBeGreaterThan(5);
    });
  });
});
