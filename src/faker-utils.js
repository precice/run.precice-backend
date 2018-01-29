const {readdirSync, readFileSync} = require('fs');
const {join} = require('path');
const { TIMESTAMP_REGEX, TIMESTAMP_PREFIX, THRESOLD, COUPLING_SEPARATOR } = require('./constants');


function get_dump_obj() {

  const folders = readdirSync(join(__dirname, '../dumps/'));

  return folders.reduce((red, folder) => {

    const dump_su2 = readFileSync(join(__dirname, '../dumps/', folder, 'su2.log'), 'utf8');
    const dump_ccx = readFileSync(join(__dirname, '../dumps/', folder, 'ccx.log'), 'utf8');
    red[folder] = {
      su2: parse_dump(dump_su2),
      ccx: parse_dump(dump_ccx),
    };
    return red;
  }, {});
}

function parse_dump(dump) {
  const [before, after] = dump.split(COUPLING_SEPARATOR);
  return {
    before: prepare_dump_parts(before + COUPLING_SEPARATOR),
    after: prepare_dump_parts(after),
  }


}

function prepare_dump_parts(dump) {


  const parts = dump.split(TIMESTAMP_PREFIX);
  parts.shift();

  if (!parts.length) {
    debugger;
  }

  const [, last_t] = TIMESTAMP_REGEX.exec(parts[parts.length - 1]);
  const arr_length = Math.ceil(last_t / THRESOLD) + 1;
  const ticks = [...new Array(arr_length)].map(x => '');
  parts.forEach((elm) => {
    const [, t, c] = TIMESTAMP_REGEX.exec(elm);
    const ind = Math.floor(t / THRESOLD);
    if (ticks[ind] === undefined){
      debugger;
    }
    ticks[ind] = ticks[ind] + c;
  });

  return ticks;
}


module.exports = {
  get_dump_obj,
};