import {
  PipeTransform,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { TaskStatusEnum } from '../enums';

export class TaskStatusValidationPipe implements PipeTransform {
  readonly allowedStatus = [
    TaskStatusEnum.DONE,
    TaskStatusEnum.IN_PROGRESS,
    TaskStatusEnum.TODO,
  ];

  transform(value: any, metadata: ArgumentMetadata) {
    value = value.toUpperCase();
    if (!this.isStatusValid(value)) {
      throw new BadRequestException(`"${value}" is an invalid status!`);
    }
    return value;
  }

  private isStatusValid(status: any) {
    const idx = this.allowedStatus.indexOf(status);
    return idx !== -1;
  }
}
