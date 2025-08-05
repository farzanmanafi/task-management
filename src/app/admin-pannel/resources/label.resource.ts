import { ResourceOptions } from 'adminjs';
import { Label } from '../../labels/entities/label.entity';

export const LabelResource = {
  resource: Label,
  options: {
    parent: {
      name: 'Configuration',
      icon: 'Tag',
    },
    listProperties: ['id', 'name'],
    showProperties: ['id', 'name'],
    editProperties: ['name'],
    filterProperties: ['name'],
  } as ResourceOptions,
};
