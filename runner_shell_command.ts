import * as shell from 'shelljs';

function runShellCommand() {
    const command = 'git status';
    let result = shell.exec(`${command}`);
    const {stderr, stdout} = result;
    if(result.code !== 0) {
        shell.echo(stderr);
        shell.exit(1);
    }
}

runShellCommand();
