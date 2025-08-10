// src/shared/decorators/cache-tags.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const CACHE_TAGS_KEY = 'cache_tags';

export const CacheTags = (...tags: string[]) =>
  SetMetadata(CACHE_TAGS_KEY, tags);

// Usage examples in controllers
/*
@Controller('tasks')
export class TasksController {
  @Get()
  @CacheTags('tasks', 'user_tasks')
  @CacheData('tasks:{userId}:{query}', 300)
  async findAll(@Query() query: any, @CurrentUser() user: User) {
    // Implementation
  }

  @Post()
  async create(@Body() createTaskDto: CreateTaskDto, @CurrentUser() user: User) {
    const task = await this.tasksService.create(createTaskDto, user);
    
    // Invalidate related caches
    await this.advancedCacheService.invalidateByTags(['tasks', 'user_tasks']);
    
    return task;
  }
}
*/
