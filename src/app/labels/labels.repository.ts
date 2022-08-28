import { Repository, EntityRepository } from 'typeorm';
import { GetLabelFilterDto } from './dto/get-labels-filter.dto';
import { Label } from './entities/label.entity';
import { CreateLabelDto } from './dto/create-label.dto';

//TODO read repository pattern
@EntityRepository(Label)
export class LabelRepository extends Repository<Label> {
  async createLabel(createLabelDto: CreateLabelDto): Promise<Label> {
    const { name } = createLabelDto;
    const label = new Label();
    label.name = name;
    await label.save();
    return label;
  }

  async getlabels(filterDto: GetLabelFilterDto): Promise<any> {
    const { search } = filterDto;
    const query = this.createQueryBuilder('label');

    if (search) {
      query.andWhere('(label.name LIKE :search)', { search: `%${search}%` });
    }

    const label = await query.getMany();
    return label;
  }
}
