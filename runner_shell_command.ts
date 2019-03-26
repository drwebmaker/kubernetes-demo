import * as shell from 'shelljs';
import * as _ from 'lodash';

const context = {
    PROJECT_ID: 'mongodb-cloud',
    BILLING_ACCOUNT: '0X0X0X-0X0X0X-0X0X0X',
};

function runShellCommand(command) {
    let result = shell.exec(`${command}`);
    const {stderr, stdout} = result;
    if(result.code !== 0) {
        shell.echo(stderr);
        shell.exit(1);
    }
}

function getProjectInstances(context) {
    const {
        PROJECT_ID
    } = context;

    const command = `gcloud projects list --filter="${PROJECT_ID}"`;
    runShellCommand(command);
}

function createGcpProject(context) {
    const {
        PROJECT_ID
    } = context;

    const command = `gcloud projects create ${PROJECT_ID}`;
    runShellCommand(command);
}

function linkProjectToBilling(context) {
    const {
        PROJECT_ID,
        BILLING_ACCOUNT
    } = context;

    const command = `gcloud beta billing projects link ${PROJECT_ID} --billing-account=${BILLING_ACCOUNT}`;
    runShellCommand(command);
}

function getGcpInstanceList() {
    const command = `gcloud compute instances lis`;
    runShellCommand(command);
}


const gcp_project_instances = getProjectInstances(context);

if (_.isEmpty(gcp_project_instances)) {
    createGcpProject(context);
    linkProjectToBilling(context);
    getGcpInstanceList;
}

