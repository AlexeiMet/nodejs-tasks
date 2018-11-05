import * as fs from 'fs';


export class FsCombined {

    constructor({ reqType }) {
        this.reqType = reqType;
    }

    getStats(itemPath) {
        return new Promise((res, rej) => {
            if (this.sync) {
                try {
                    const stats = fs.statSync(itemPath);
                    res(stats);
                } catch (err) {
                    rej(err);
                }
            } else {
                fs.stat(itemPath, (err, stats) => err ? rej(err) : res(stats));
            }
        });
    }

    readFile(filePath) {
        return new Promise((res, rej) => {
            if (this.sync) {
                fs.readFile(filePath, (err, data) => err ? rej(err) : res(data));
            } else {
                const data = fs.readFileSync(filePath);
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
