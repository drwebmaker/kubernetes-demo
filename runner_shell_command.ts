import * as shell from 'shelljs';

function runShellCommand() {
    const command = 'git status';
    let result = shell.exec(`${command}`, {silent:true}).stdout;
    console.log(result);
}

runShellCommand();
