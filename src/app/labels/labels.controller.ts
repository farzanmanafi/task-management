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
  UseGuards,
} from '@nestjs/common';
import { LabelsService } from './labels.service';
import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';
import { GetLabelFilterDto } from './dto/get-labels-filter.dto';
import { Label } from './entities/label.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../auth/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('labels')
@UseGuards(JwtAuthGuard)
export class LabelsController {
  private logger = new Logger('LabelsController');
  constructor(private readonly labelsService: LabelsService) {}

  @Post()
  @UsePipes(ValidationPipe)
  create(@Body() createLabelDto: CreateLabelDto, @CurrentUser() user: User) {
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
    @CurrentUser() user: User,
  ): Promise<Label[]> {
    this.logger.verbose(
      `User "${user.username}" retrieving all labels ${JSON.stringify(filterDto)}`,
    );
    return this.labelsService.getLabels(filterDto);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<Label> {
    this.logger.verbose(
      `User "${user.username}" retrieving a label with Id: ${id}.`,
    );
    return this.labelsService.getLabelById(+id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLabelDto: UpdateLabelDto,
    @CurrentUser() user: User,
  ): Promise<Label> {
    this.logger.verbose(
      `User "${user.username}" updating a label. Data: ${JSON.stringify(
        updateLabelDto,
      )}.`,
    );
    return this.labelsService.updateLabel(+id, updateLabelDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User): Promise<void> {
    this.logger.verbose(
      `User "${user.username}" deleting a label with Id: ${id}.`,
    );
    return this.labelsService.deleteLabel(+id);
  }
}
