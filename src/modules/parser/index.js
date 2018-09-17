import * as fs from 'fs';
import * as path from 'path';
import { parseString as parseXml } from 'xml2js';
import parseCsv from 'csv-parse';
const glob = require('glob-fs')();
import { detailedDiff } from 'deep-object-diff';

export class Parser {

  constructor() {
    this.filesData = {};
  }

  watchChanges(globPattern, delay, cb) {
    glob.readdir(globPattern, (err, filepaths) => {
      if (err) {
        cb(err);
      } else {
        this.watchedFilePaths = filepaths;
        filepaths.forEach((filepath) => {
          this.watchSingleChanges(filepath, delay, cb);
        });
      }
    });
  }

  async watchSingleChanges(filepath, delay, cb) {
    this.getParsedData(filepath)
      .then((data) => {
        this.setFileData(filepath, data);
        fs.watchFile(filepath, {interval: delay}, () => {
          this.getParsedData(filepath)
            .then((data) => {
              const changes = detailedDiff(this.filesData[filepath], data);
              cb(null, changes);
              this.setFileData(filepath, data);
            })
            .catch(err => cb(err));
        });
      })
      .catch(err => cb(err));
  }

  stopWatchChanges() {
    this.watchedFilePaths.forEach((filepath) => {
      fs.unwatchFile(filepath);
    });
  }

  setFileData(filepath, data) {
    this.filesData[filepath] = data;
  }

  getParsedData(filepath) {
    return new Promise((res, rej) => {
      fs.readFile(filepath, (err, data) => {
        if (err) {
          rej(err);
        } else {
          const ext = path.extname(filepath);
          if (ext === '.xml') {
            parseXml(data, (err, parsedData) => {
              err ? rej(err) : res(parsedData);
            });
          } else if (ext === '.csv') {
            parseCsv(data, (err, parsedData) => {
              err ? rej(err) : res(parsedData);
            });
          } else {
            rej(Error(`File of format '${ext}' is not supported!`));
          }
        }
      });
    });
  }

}
