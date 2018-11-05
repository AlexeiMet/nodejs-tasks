import * as path from 'path';
import parseCsv from 'csv-parse';
import parseCsvSync from 'csv-parse/lib/sync';
import * as xmlParser from 'fast-xml-parser';


export class CombinedParser {

    constructor({ reqType }) {
        this.reqType = reqType;
    }

    parse({ name, buffer }) {
        return new Promise(async (res, rej) => {
            const ext = path.extname(name);

            let parsedData;

            switch (ext) {
                case '.csv':
                    parsedData = await this.parseCsv(buffer);
                    break;

                case '.xml':
                    parsedData = await this.parseXml(buffer);
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

}