import * as fs from 'fs';
import * as path from 'path';
import parseCsv from 'csv-parse';
import parseCsvSync from 'csv-parse/lib/sync';
import * as xmlParser from 'fast-xml-parser';

export class Parser {

    constructor() {
        this.itemsStats = {};
    }

    watchChangesSync(...args) {
        this.startWatch(...args);
        this.sync = true;
    }

    watchChanges(...args) {
        this.startWatch(...args);
        this.sync = false;
    }

    startWatch(dirpath, interval, cb) {
        this.dirpath = dirpath;
        this.interval = interval;
        this.cb = cb;

        this.tick();
        this.interval = setInterval(() => {
            this.tick();
        }, interval);
    }

    stopWatch() {
        clearInterval(this.interval);
    }

    async tick() {
        let changes;
        try {
            changes = await this.getNSetDirChanges();
        } catch (err) {
            this.cb(err);
            return;
        }
        this.cb(null, changes);
    }

    getNSetDirChanges() {
        return new Promise(async (res, rej) => {
            const itemsStats = await this.getItemsStats();
            const changes = await this.getItemsChanges(itemsStats);
            this.itemsStats = itemsStats;
            res(changes);
        });
    }

    getItemsStats() {
        return new Promise(async (res, rej) => {
            const itemsStats = {};
            const itemsStatsPromise = [];
            const items = await this.readdir(this.dirpath);
            items.forEach((itemname) => {
                const itempath = path.resolve(this.dirpath, itemname);
                const setItemStats = async () => {
                    itemsStats[itemname] = await this.getStats(itempath);
                }
                itemsStatsPromise.push(setItemStats());
            });
            Promise.all(itemsStatsPromise)
                .then(() => res(itemsStats))
                .catch((err) => rej(err));
        });
    }

    async getItemsChanges(itemsStats) {
        return new Promise((res, rej) => {
            const changes = {};
            const changesPromises = [];
            for (let itemname in itemsStats) {
                const itemStats = itemsStats[itemname];
                if (
                    !this.itemsStats[itemname] ||
                    itemStats.isFile() &&
                    this.itemsStats[itemname] &&
                    itemStats.mtimeMs > this.itemsStats[itemname].mtimeMs
                ) {
                    const setFileChanges = async () => {
                        const parsedFileData = await this.getParsedData(itemname);
                        if (parsedFileData) {
                            changes[itemname] = parsedFileData;
                        }
                    }
                    changesPromises.push(setFileChanges());
                }
            }
            Promise.all(changesPromises)
                .then(() => res(changes))
                .catch((err) => rej(err));
        });
    }

    getParsedData(filename) {
        return new Promise(async (res, rej) => {
            const filepath = path.resolve(this.dirpath, filename);
            const fileExtName = path.extname(filepath);
            const fileData = await this.readFile(filepath);
            let parsedData;
            switch (fileExtName) {
                case '.csv':
                    parsedData = await this.parseCsv(fileData);
                    break;
                case '.xml':
                    parsedData = await this.parseXml(fileData);
                    break;
            }
            res(parsedData);
        });
    }

    parseCsv(fileData) {
        return new Promise(async (res, rej) => {
            if (this.sync) {
                try {
                    const parsedData = parseCsvSync(fileData);
                    res(parsedData);
                } catch (err) {
                    rej(err);
                }
            } else {
                parseCsv(fileData, (err, parsedData) => err ? rej(err) : res(parsedData));
            }
        });
    }

    parseXml(fileData) {
        return new Promise((res, rej) => {
            try {
                const parsedData = xmlParser.parse(fileData.toString());
                res(parsedData);
            } catch (err) {
                rej(err);
            }
        });
    }

    getStats(itempath) {
        return new Promise((res, rej) => {
            if (this.sync) {
                try {
                    const stats = fs.statSync(itempath);
                    res(stats);
                } catch (err) {
                    rej(err);
                }
            } else {
                fs.stat(itempath, (err, stats) => err ? rej(err) : res(stats));
            }
        });
    }

    readFile(filepath) {
        return new Promise((res, rej) => {
            if (this.sync) {
                fs.readFile(filepath, (err, data) => err ? rej(err) : res(data));
            } else {
                const data = fs.readFileSync(filepath);
                res(data);
            }
        });
    }

    readdir(dirpath) {
        return new Promise((res, rej) => {
            if (this.sync) {
                fs.readdir(dirpath, (err, items) => err ? rej(err) : res(items));
            } else {
                const items = fs.readdirSync(dirpath);
                res(items);
            }
        })
    }

}
