import * as path from 'path';
import { Watcher } from './modules/watcher/watcher';

const watcher = new Watcher();

watcher.watchChanges(path.resolve(__dirname, '../data'), 1000, (err, changes) => {
    console.log(err ? err : changes);
});
