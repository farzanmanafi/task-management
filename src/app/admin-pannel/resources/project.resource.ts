import { ResourceWithOptions } from 'adminjs';
import { Project } from 'src/app/projects/entities/project.entity';

export const ProjectResource: ResourceWithOptions = {
  resource: Project,
  options: {
    properties: {},
  },
  features: [],
};
export default ProjectResource;
