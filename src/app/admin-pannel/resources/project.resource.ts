import { ResourceWithOptions } from 'adminjs';
import { Project } from 'src/app/projects/entities/project.entity';

export const ProjectResource: ResourceWithOptions = {
  resource: Project,
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
export default ProjectResource;
