module.exports = {
  COUPLING_SEPARATOR: 'Setting up master communication to coupling partner/s',
  THRESOLD: 100,
  TIMESTAMP_PREFIX: '@@TIMESTAMP ',
  TIMESTAMP_REGEX: /^([0-9]+)\n([\s\S]*)$/,
  CONSOLE_ID_MAPPING: {
    'LEFT_CONSOLE': 'su2',
    'RIGHT_CONSOLE': 'ccx',
  },
  CONSOLE_ID_INVERSE: {
    'su2': 'LEFT_CONSOLE',
    'ccx': 'RIGHT_CONSOLE',
  },
  PARTS: {
    1: '01explConvergence',
    2: '02explDivergence',
    3: '03aitken',
    4: '04newton',
    5: '05newtonParallel',
  }
};
