import * as migration_20260430_035717 from './20260430_035717';
import * as migration_20260501_203655 from './20260501_203655';
import * as migration_20260502_022000 from './20260502_022000';

export const migrations = [
  {
    up: migration_20260430_035717.up,
    down: migration_20260430_035717.down,
    name: '20260430_035717'
  },
  {
    up: migration_20260501_203655.up,
    down: migration_20260501_203655.down,
    name: '20260501_203655'
  },
  {
    up: migration_20260502_022000.up,
    down: migration_20260502_022000.down,
    name: '20260502_022000'
  },
];
