import { TaskStatus, TaskPriority } from '../models/Task';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateTask = (data: any): ValidationResult => {
  const errors: string[] = [];

  // Title validation
  if (!data.title || typeof data.title !== 'string') {
    errors.push('Title is required and must be a string');
  } else if (data.title.length < 3 || data.title.length > 100) {
    errors.push('Title must be between 3 and 100 characters');
  }

  // Description validation (optional)
  if (data.description !== undefined && typeof data.description !== 'string') {
    errors.push('Description must be a string');
  }

  // Status validation
  const validStatuses: TaskStatus[] = ['todo', 'in-progress', 'done'];
  if (!data.status || !validStatuses.includes(data.status)) {
    errors.push('Status must be one of: todo, in-progress, done');
  }

  // Priority validation
  const validPriorities: TaskPriority[] = ['low', 'medium', 'high'];
  if (!data.priority || !validPriorities.includes(data.priority)) {
    errors.push('Priority must be one of: low, medium, high');
  }

  // Due date validation
  if (!data.dueDate) {
    errors.push('Due date is required');
  } else {
    const dueDate = new Date(data.dueDate);
    if (isNaN(dueDate.getTime())) {
      errors.push('Due date must be a valid date');
    } else if (dueDate <= new Date()) {
      errors.push('Due date must be in the future');
    }
  }

  // Tags validation
  if (!Array.isArray(data.tags)) {
    errors.push('Tags must be an array');
  } else {
    for (const tag of data.tags) {
      if (typeof tag !== 'string') {
        errors.push('All tags must be strings');
        break;
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateTaskUpdate = (data: any): ValidationResult => {
  const errors: string[] = [];

  // Title validation (optional for update)
  if (data.title !== undefined) {
    if (typeof data.title !== 'string') {
      errors.push('Title must be a string');
    } else if (data.title.length < 3 || data.title.length > 100) {
      errors.push('Title must be between 3 and 100 characters');
    }
  }

  // Description validation (optional)
  if (data.description !== undefined && typeof data.description !== 'string') {
    errors.push('Description must be a string');
  }

  // Status validation (optional)
  const validStatuses: TaskStatus[] = ['todo', 'in-progress', 'done'];
  if (data.status !== undefined && !validStatuses.includes(data.status)) {
    errors.push('Status must be one of: todo, in-progress, done');
  }

  // Priority validation (optional)
  const validPriorities: TaskPriority[] = ['low', 'medium', 'high'];
  if (data.priority !== undefined && !validPriorities.includes(data.priority)) {
    errors.push('Priority must be one of: low, medium, high');
  }

  // Due date validation (optional)
  if (data.dueDate !== undefined) {
    const dueDate = new Date(data.dueDate);
    if (isNaN(dueDate.getTime())) {
      errors.push('Due date must be a valid date');
    } else if (dueDate <= new Date()) {
      errors.push('Due date must be in the future');
    }
  }

  // Tags validation (optional)
  if (data.tags !== undefined) {
    if (!Array.isArray(data.tags)) {
      errors.push('Tags must be an array');
    } else {
      for (const tag of data.tags) {
        if (typeof tag !== 'string') {
          errors.push('All tags must be strings');
          break;
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};