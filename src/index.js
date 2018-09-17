import { Parser } from './modules/parser';

const parser = new Parser();

parser.watchChanges('data/**/*', 1000, (err, changes) => {
  err ? console.log('error handled: ', err) : console.log(changes);
});

setTimeout(() => {
  parser.stopWatchChanges();
}, 10000);
