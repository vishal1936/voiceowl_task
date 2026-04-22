import { Request, Response } from 'express';
import Task, { ITask, TaskStatus, TaskPriority } from '../models/Task';
import { validateTask, validateTaskUpdate } from '../utils/validation';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface TaskQuery {
  status?: TaskStatus;
  priority?: TaskPriority;
  tags?: string;
  dueBefore?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
  page?: string;
  limit?: string;
}

export const createTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = validateTask(req.body);
    if (!validation.isValid) {
      const response: ApiResponse = {
        success: false,
        message: 'Validation failed',
        errors: validation.errors,
      };
      res.status(400).json(response);
      return;
    }

    const task = new Task(req.body);
    const savedTask = await task.save();

    const response: ApiResponse<ITask> = {
      success: true,
      data: savedTask,
    };
    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating task:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Internal server error',
    };
    res.status(500).json(response);
  }
};

export const getTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      status,
      priority,
      tags,
      dueBefore,
      sortBy = 'createdAt',
      order = 'desc',
      page = '1',
      limit = '10',
    } = req.query as TaskQuery;

    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    if (tags) {
      query.tags = { $in: tags.split(',') };
    }

    if (dueBefore) {
      query.dueDate = { $lte: new Date(dueBefore) };
    }

    const sortOptions: any = {};
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const tasks = await Task.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Task.countDocuments(query);

    const response: ApiResponse<{ tasks: ITask[]; total: number; page: number; limit: number }> = {
      success: true,
      data: {
        tasks,
        total,
        page: pageNum,
        limit: limitNum,
      },
    };
    res.status(200).json(response);
  } catch (error) {
    console.error('Error getting tasks:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Internal server error',
    };
    res.status(500).json(response);
  }
};

export const getTaskById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id).lean();
    if (!task) {
      const response: ApiResponse = {
        success: false,
        message: 'Task not found',
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<ITask> = {
      success: true,
      data: task,
    };
    res.status(200).json(response);
  } catch (error) {
    console.error('Error getting task by ID:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Internal server error',
    };
    res.status(500).json(response);
  }
};

export const updateTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const validation = validateTaskUpdate(req.body);
    if (!validation.isValid) {
      const response: ApiResponse = {
        success: false,
        message: 'Validation failed',
        errors: validation.errors,
      };
      res.status(400).json(response);
      return;
    }

    const task = await Task.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).lean();

    if (!task) {
      const response: ApiResponse = {
        success: false,
        message: 'Task not found',
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<ITask> = {
      success: true,
      data: task,
    };
    res.status(200).json(response);
  } catch (error) {
    console.error('Error updating task:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Internal server error',
    };
    res.status(500).json(response);
  }
};

export const deleteTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const task = await Task.findByIdAndDelete(id).lean();
    if (!task) {
      const response: ApiResponse = {
        success: false,
        message: 'Task not found',
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: 'Task deleted successfully',
    };
    res.status(200).json(response);
  } catch (error) {
    console.error('Error deleting task:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Internal server error',
    };
    res.status(500).json(response);
  }
};

export const getTaskStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await Task.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          byStatus: {
            $push: '$status',
          },
          byPriority: {
            $push: '$priority',
          },
        },
      },
      {
        $project: {
          total: 1,
          byStatus: {
            todo: { $size: { $filter: { input: '$byStatus', cond: { $eq: ['$$this', 'todo'] } } } },
            'in-progress': { $size: { $filter: { input: '$byStatus', cond: { $eq: ['$$this', 'in-progress'] } } } },
            done: { $size: { $filter: { input: '$byStatus', cond: { $eq: ['$$this', 'done'] } } } },
          },
          byPriority: {
            low: { $size: { $filter: { input: '$byPriority', cond: { $eq: ['$$this', 'low'] } } } },
            medium: { $size: { $filter: { input: '$byPriority', cond: { $eq: ['$$this', 'medium'] } } } },
            high: { $size: { $filter: { input: '$byPriority', cond: { $eq: ['$$this', 'high'] } } } },
          },
        },
      },
    ]);

    const result = stats[0] || { total: 0, byStatus: { todo: 0, 'in-progress': 0, done: 0 }, byPriority: { low: 0, medium: 0, high: 0 } };

    const response: ApiResponse = {
      success: true,
      data: result,
    };
    res.status(200).json(response);
  } catch (error) {
    console.error('Error getting task stats:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Internal server error',
    };
    res.status(500).json(response);
  }
};