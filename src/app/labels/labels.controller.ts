import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UsePipes,
  ValidationPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { LabelsService } from './labels.service';
import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';
import { GetLabelFilterDto } from './dto/get-labels-filter.dto';
import { Label } from './entities/label.entity';

@Controller('labels')
export class LabelsController {
  constructor(private readonly labelsService: LabelsService) {}

  @Post()
  @UsePipes(ValidationPipe)
  create(@Body() createLabelDto: CreateLabelDto) {
    return this.labelsService.createLabel(createLabelDto);
  }

  @Get()
  findAll(filterDto: GetLabelFilterDto): Promise<Label[]> {
    return this.labelsService.getLabels(filterDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Label> {
    return this.labelsService.getLabelById(+id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLabelDto: UpdateLabelDto,
  ): Promise<Label> {
    return this.labelsService.updateLabel(+id, updateLabelDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.labelsService.deleteLabel(+id);
  }
}
