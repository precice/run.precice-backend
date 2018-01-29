const spawn = require('child_process').spawn;
const fs = require('fs');
const path = require('path');

if (process.argv.length !== 3) {
      console.log('Usage: node record-coupling-output.js ../../precice_root_directory \nE.g. node record-coupling-output /home/bgce17/userStory/01explConvergence');
        process.exit();
}

const preciceCwd = process.argv[2];

const casePath = preciceCwd.split('/');
const caseDesc = casePath[casePath.length -1] || casePath[casePath.length -2] // also allow trailing dash
const dumpDir = path.join(__dirname, '../dumps/', caseDesc);

if (!fs.existsSync(dumpDir)) {
      fs.mkdirSync(dumpDir);
}
const su2Dump = fs.createWriteStream(path.join(dumpDir, 'su2.log'));
const ccxDump = fs.createWriteStream(path.join(dumpDir, 'ccx.log'));

const su2 = spawn('/bin/sh', ['-c', 'SU2_CFD euler_config_coupled.cfg'], {cwd: preciceCwd});
const ccx = spawn('/bin/sh', ['-c', 'ccx_preCICE -i flap -precice-participant Calculix '], {cwd: preciceCwd});

let su2Start, ccxStart, su2Bp, ccxBp;

su2.stdout.on('data', function (data) {
        const now = Date.now();
            if (!su2Start) {
                        su2Start = now;
                            }
                su2Dump.write('@@TIMESTAMP ' + (now-su2Start) + '\n' + data, 'utf8');
});

ccx.stdout.on('data', function (data) {
        const now = Date.now();
            if (!ccxStart) {
                        ccxStart = now;
                            }
                ccxDump.write('@@TIMESTAMP ' + (now-ccxStart) + '\n' + data, 'utf8');
});

su2.on('exit', () => {
        su2Dump.end();
});

ccx.on('exit', () => {
        ccxDump.end();
});

