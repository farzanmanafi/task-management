import { ResourceWithOptions } from 'adminjs';
import { Label } from 'src/app/labels/entities/label.entity';

export const LabelResource: ResourceWithOptions = {
  resource: Label,
  options: {
    actions: {
      // list: { icon: 'Add', isVisible: true },
      // edit: { icon: 'Add', isVisible: false },
      // delete: { icon: 'Add', isVisible: false },
      // new: { icon: 'Add', isVisible: false },
      // bulkDelete: { icon: 'Add', isVisible: false },
    },
  },
  features: [],
};
export default LabelResource;
