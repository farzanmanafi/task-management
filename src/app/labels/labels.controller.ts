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
  Logger,
} from '@nestjs/common';
import { LabelsService } from './labels.service';
import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';
import { GetLabelFilterDto } from './dto/get-labels-filter.dto';
import { Label } from './entities/label.entity';
import { GetUser } from '../auth/decorator/get-user.dec';
import { User } from '../auth/entities/user.entity';

@Controller('labels')
export class LabelsController {
  private logger = new Logger('ProjectsController');
  constructor(private readonly labelsService: LabelsService) {}

  @Post()
  @UsePipes(ValidationPipe)
  create(@Body() createLabelDto: CreateLabelDto, @GetUser() user: User) {
    this.logger.verbose(
      `User "${user.username}" creating a new label. Data: ${JSON.stringify(
        createLabelDto,
      )}.`,
    );
    return this.labelsService.createLabel(createLabelDto);
  }

  @Get()
  findAll(
    filterDto: GetLabelFilterDto,
    @GetUser() user: User,
  ): Promise<Label[]> {
    this.logger.verbose(
      `User "${user.username}" retriving all labels ${filterDto}`,
    );
    return this.labelsService.getLabels(filterDto);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ): Promise<Label> {
    this.logger.verbose(
      `User "${user.username}" retrivinga a label with Id: ${id}.`,
    );
    return this.labelsService.getLabelById(+id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLabelDto: UpdateLabelDto,
    @GetUser() user: User,
  ): Promise<Label> {
    this.logger.verbose(
      `User "${user.username}" updating a label. Data: ${JSON.stringify(
        updateLabelDto,
      )}.`,
    );
    return this.labelsService.updateLabel(+id, updateLabelDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: User): Promise<void> {
    this.logger.verbose(
      `User "${user.username}" delete a label with Id: ${id}.}.`,
    );
    return this.labelsService.deleteLabel(+id);
  }
}
