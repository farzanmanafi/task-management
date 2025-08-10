import { Repository, EntityRepository } from 'typeorm';
import { GetLabelFilterDto } from './dto/get-labels-filter.dto';
import { Label } from './entities/label.entity';
import { CreateLabelDto } from './dto/create-label.dto';
import { Logger, InternalServerErrorException } from '@nestjs/common';

@EntityRepository(Label)
export class LabelRepository extends Repository<Label> {
  private logger = new Logger('LabelRepository');

  async createLabel(createLabelDto: CreateLabelDto): Promise<Label> {
    try {
      const { name } = createLabelDto;
      const label = new Label();
      label.name = name;
      await label.save();
      return label;
    } catch (error) {
      this.logger.error(`Failed to create a label for task.`, error.stack);
      throw new InternalServerErrorException();
    }
  }

  async getlabels(filterDto: GetLabelFilterDto): Promise<any> {
    try {
      const { search } = filterDto;
      const query = this.createQueryBuilder('label');

      if (search) {
        query.andWhere('(label.name LIKE :search)', { search: `%${search}%` });
      }

      const label = await query.getMany();
      return label;
    } catch (error) {
      this.logger.error(`Failed to get labels of tasks`, error.stack);
      throw new InternalServerErrorException();
    }
  }
}
