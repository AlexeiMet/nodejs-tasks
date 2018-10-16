import * as path from 'path';
import { FsChangeDetector } from './fs-change-detector';
import { CombinedParser } from './combined-parser';


export class Watcher {

    watchChangesSync(...args) {
        this.startWatch(...args);
        this.sync = true;
    }

    watchChanges(...args) {
        this.startWatch(...args);
        this.sync = false;
    }

    startWatch(dirPath, interval, cb) {
        const reqType = this.sync ? 'sync' : 'async';

        this.cb = cb;
        this.fsChangeDetector = new FsChangeDetector({ reqType, dirPath });
        this.parser = new CombinedParser({ reqType });

        this.tick();
        this.intervalId = setInterval(() => {
            this.tick();
        }, interval);
    }

    stopWatch() {
        clearInterval(this.intervalId);
    }

    async tick() {
        const changes = await this.fsChangeDetector.getChanges();

        if (changes) {

            const changesModifiers = [];

            changes.eachItem(({ name, buffer }, changeType) => {
                const changesModifier = async () => {
                    const parsedChanges = await this.parser.parse({ name, buffer });
                    changes[changeType][name] = parsedChanges ? parsedChanges : buffer;
                };

                changesModifiers.push(changesModifier());
            });

            Promise.all(changesModifiers).then(() => {

                this.cb(null, changes);

            });

        }
    }

}
