import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { LabelRepository } from './labels.repository';
import { Label } from './entities/label.entity';
import { GetLabelFilterDto } from './dto/get-labels-filter.dto';

@Injectable()
export class LabelsService {
  constructor(
    @InjectRepository(LabelRepository)
    private labelRepository: LabelRepository,
  ) {}

  getLabels(filterDto: GetLabelFilterDto): Promise<Label[]> {
    return this.labelRepository.getlabels(filterDto);
  }

  async getLabelById(id: number): Promise<Label> {
    const found = await this.labelRepository.findOne({
      where: { id },
    });
    if (!found) throw new NotFoundException(`Label with ID: ${id} not found!`);
    return found;
  }

  async createLabel(createLabelDto: CreateLabelDto): Promise<Label> {
    return this.labelRepository.createLabel(createLabelDto);
  }

  async updateLabel(
    id: number,
    updateLabelDto: UpdateLabelDto,
  ): Promise<Label> {
    const { name } = updateLabelDto;
    const label = await this.getLabelById(id);
    label.name = name;
    await this.labelRepository.save(label);
    return label;
  }

  async deleteLabel(id: number): Promise<void> {
    const found = await this.getLabelById(id);
    if (found) await this.labelRepository.delete(id);
  }
}
