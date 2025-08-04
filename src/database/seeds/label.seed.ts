import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Label } from '../../app/labels/entities/label.entity';

@Injectable()
export class LabelSeeder {
  constructor(
    @InjectRepository(Label)
    private labelRepository: Repository<Label>,
  ) {}

  async seed(): Promise<void> {
    console.log('Seeding labels...');

    const labels = [
      { name: 'Frontend' },
      { name: 'Backend' },
      { name: 'Database' },
      { name: 'API' },
      { name: 'UI/UX' },
      { name: 'Testing' },
      { name: 'Documentation' },
      { name: 'Security' },
      { name: 'Performance' },
      { name: 'Mobile' },
      { name: 'DevOps' },
      { name: 'Bug' },
      { name: 'Enhancement' },
      { name: 'Critical' },
      { name: 'Research' },
    ];

    for (const labelData of labels) {
      const existingLabel = await this.labelRepository.findOne({
        where: { name: labelData.name },
      });

      if (!existingLabel) {
        const label = this.labelRepository.create(labelData);
        await this.labelRepository.save(label);
        console.log(`Created label: ${labelData.name}`);
      } else {
        console.log(`Label already exists: ${labelData.name}`);
      }
    }

    console.log('Labels seeded successfully!');
  }
}
