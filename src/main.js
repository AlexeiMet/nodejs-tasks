import * as fs from 'fs';
import { Parser } from './modules/parser/parser';

const parser = new Parser();

parser.watchChanges('./data', 1000, (err, changes) => {
    console.log(err ? err : changes);
});
