import * as path from 'path';
import { FsCombined } from './fs-combined';


export class FileState {

    constructor(options) {
        this.stats = options.stats || {};
        this.buffer = options.buffer || {};
    }

}

export class DirChanges {

    constructor(options = {}) {
        options.added && (this.added = options.added);
        options.deleted && (this.deleted = options.deleted);
        options.changed && (this.changed = options.changed);
    }

    eachItem(cb) {
        const eachOfType = (type) => {
            for (let name in this[type]) {
                const buffer = this[type][name];
                cb({ name, buffer }, type);
            }
        };
        ['added', 'deleted', 'changed'].forEach(type => eachOfType(type));
    }

}

export class FsChangeDetector {

    constructor({ reqType, dirPath }) {
        this.filesState = {};
        this.dirPath = dirPath;
        this.fs = new FsCombined({ reqType });
    }

    getChanges(save = true) {
        return new Promise(async (res, rej) => {
            const files = await this.getTrackFiles();

            const changes = new DirChanges();

            // Detect added and changed files by going through given filed
            for (let fileName in files) {

                const file = files[fileName];

                if (!this.filesState[fileName]) {

                    if (!changes.added) { changes.added = {}; }
                    changes.added[fileName] = file.buffer;

                } else if ( this.detectChanges(fileName, file) ) {

                    if (!changes.changed) { changes.changed = {}; }
                    changes.changed[fileName] = file.buffer;

                }

                if (save) {
                    this.filesState[fileName] = file;
                }
            }

            // Detect deleted files by going through given saved files
            for (let fileName in this.filesState) {
                if (!Object.keys(files).includes(fileName)) {

                    const { buffer } = this.filesState[fileName];

                    if (!changes.deleted) { changes.deleted = {}; }
                    changes.deleted[fileName] = buffer;

                    if (save) {
                        delete this.filesState[fileName];
                    }
                }
            }

            const output = Object.keys(changes).length ? changes : null;
            res(output);
        });
    }

    async getTrackFiles() {
        const dirItems = await this.fs.readdir(this.dirPath);

        const files = {};

        return Promise.all(
            dirItems.map((itemName) => {
                const filesModifier = async () => {
                    const itemPath = this.itemPath(itemName);
                    const stats = await this.fs.getStats(itemPath);

                    if (stats.isFile()) {
                        const buffer = await this.fs.readFile(itemPath);
                        const file = new FileState({ stats, buffer });
                        files[itemName] = file;
                    };
                };
                return filesModifier();
            })
        ).then(() => files);
    }

    detectChanges(fileName, currentFile) {
        const prevFile = this.filesState[fileName];

        if (!prevFile) { return true; }

        const isChangedByStats = currentFile.stats.mtimeMs > prevFile.stats.mtimeMs;

        if (isChangedByStats) {
            const isChangedByBuffer = !currentFile.buffer.equals(prevFile.buffer);

            if (isChangedByBuffer) {

                return true;

            }
        }
    }

    itemPath(itemName) {
        return path.resolve(this.dirPath, itemName);
    }

}
