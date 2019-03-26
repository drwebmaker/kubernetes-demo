import * as shell from 'shelljs';
import * as _ from 'lodash';

const context = {
    PROJECT_ID: 'deft-upgrade-234611ad',
    BILLING_ACCOUNT: '0118E3-DAEA99-D85224',
};

function runShellCommand(command) {
    let result = shell.exec(`${command}`);
    const {stderr, stdout} = result;
    if(result.code !== 0) {
        shell.echo(stderr);
        shell.exit(1);
        return stderr;
    }
    return stdout;
}

function getProjectInstances(context) {
    const {
        PROJECT_ID
    } = context;

    const command = `gcloud projects list --filter="${PROJECT_ID}"`;
    return runShellCommand(command);
}

function createGcpProject(context) {
    const {
        PROJECT_ID
    } = context;

    const command = `gcloud projects create ${PROJECT_ID}`;
    runShellCommand(command);
}

function isBillingAccountCreated(billingAccountId) {
    const command = `gcloud beta billing accounts list --filter="${billingAccountId}"`;
    const result = runShellCommand(command);
    return !_.isEmpty(result);
}

function linkProjectToBilling(context) {
    const {
        PROJECT_ID,
        BILLING_ACCOUNT
    } = context;

    if (isBillingAccountCreated(BILLING_ACCOUNT)) {
        const command = `gcloud beta billing projects link ${PROJECT_ID} --billing-account=${BILLING_ACCOUNT}`;
        runShellCommand(command);
    }
}

function getGcpInstanceList() {
    const command = `gcloud compute instances list`;
    runShellCommand(command);
}


const gcp_project_instances = getProjectInstances(context);

if (_.isEmpty(gcp_project_instances)) {
    createGcpProject(context);
    linkProjectToBilling(context);
}
    getGcpInstanceList();
