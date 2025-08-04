import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { Queue } from 'bull';

export function setupBullBoard(queues: { [key: string]: Queue }) {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  const bullAdapters = Object.values(queues).map(queue => new BullAdapter(queue));

  createBullBoard({
    queues: bullAdapters,
    serverAdapter: serverAdapter,
  });

  return serverAdapter;
}
