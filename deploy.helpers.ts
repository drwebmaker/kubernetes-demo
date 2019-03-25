import { ExecOptions } from 'shelljs';
import * as commonHelpers from './common.helpers';
import { runShellCommand } from './common.helpers';
import * as _ from 'lodash';

export function createInstanceCms (externalContext: any, cb: Function): void {

    const {
        ID_PROJECT,
        IMAGE_NAME_CMS,
        TRAVIS_COMMIT,
        BUILD_ENV,
        NODE_ENV
    } = externalContext;


    const command = `docker build -t gcr.io/${ID_PROJECT}/${IMAGE_NAME_CMS}:${TRAVIS_COMMIT} \
                  --build-arg NODE_ENV=${NODE_ENV} \
                  --build-arg BUILD_ENV=${BUILD_ENV} \
                  --file ./Dockerfile-cms .`;

    const options: ExecOptions = {};

    return commonHelpers.runShellCommand(command, options, (error: string) => cb(error, externalContext));
}

export function getGcpInstances(externalContext: any, cb: Function) {
    const {
        INSTANCE_NAME_CMS
    } = externalContext;


    const command = `gcloud compute instances list --filter="${INSTANCE_NAME_CMS}" --format="value(networkInterfaces[0].networkIP)"`;

    const options: ExecOptions = {};

    return commonHelpers.runShellCommand(command, options, (error: string) => cb(error, externalContext));
}

export function pushImageTM (externalContext: any, cb: Function): void {

    const {
        ID_PROJECT,
        IMAGE_NAME_CMS,
        TRAVIS_COMMIT
    } = externalContext;

    const command = `gcloud docker -- push gcr.io/${ID_PROJECT}/${IMAGE_NAME_CMS}:${TRAVIS_COMMIT}`;
    const options: ExecOptions = {};

    return commonHelpers.runShellCommand(command, options, (error: string) => cb(error, externalContext));
}

export function createRedis(externalContext: any, cb: Function): void {

    const {
        INSTANCE_NAME_CMS,
        ZONE,
        ID_PROJECT,
        IMAGE_NAME_CMS,
        TRAVIS_COMMIT
    } = externalContext;

    const command = `gcloud beta compute instances create-with-container ${INSTANCE_NAME_CMS} \
             --zone=${ZONE} \
             --container-image=gcr.io/${ID_PROJECT}/${IMAGE_NAME_CMS}:${TRAVIS_COMMIT}`;
    const options: ExecOptions = {};

    return runShellCommand(command, options, (error: string) => cb(error, externalContext));
}

export function getClusterSplachIngernalIp(externalContext: any, cb: Function) {
    const {
        CLUSTER_SPLASH_NAME
    } = externalContext;

    const command = `kubectl get service ${CLUSTER_SPLASH_NAME} | grep ${CLUSTER_SPLASH_NAME} | awk '{ print $3 }')`;
    const options: ExecOptions = {};

    return commonHelpers.runShellCommand(command, options, (error: string) => cb(error, externalContext));
}

export function createCluster (externalContext: any, cb: Function): void {
    const {
        WS_MACHINE_TYPE, WS_DISK_SIZE, CLUSTER_NAME, CREATE_CLUSTER__ALLOWED_PARAMS
    } = externalContext;

    const gcloudArgs = _.pick(externalContext, CREATE_CLUSTER__ALLOWED_PARAMS);
    const commandArgs = commonHelpers.getGCloudArguments(gcloudArgs);
    const command = `gcloud container clusters create ${CLUSTER_NAME} ${commandArgs} --machine-type=${WS_MACHINE_TYPE} --disk-size=${WS_DISK_SIZE} --enable-legacy-authorization --enable-basic-auth --no-issue-client-certificate --enable-ip-alias`;
    const options: ExecOptions = {};

    return commonHelpers.runShellCommand(command, options, (error: string) => cb(error, externalContext));
}

export function createPods (externalContext: any, cb: Function): void {
    const {
        CLUSTER_SPLASH_NAME,
        NUMBER_REPLIC
    } = externalContext;

    const command = `kubectl run ${CLUSTER_SPLASH_NAME} \
        --image=docker.io/scrapinghub/splash \
        --replicas=${NUMBER_REPLIC}`;
    const options: ExecOptions = {};

    return commonHelpers.runShellCommand(command, options, (error: string) => cb(error, externalContext));
}

export function createReplicas (externalContext: any, cb: Function): void {
    const {
        NUMBER_REPLICAS,
        CLUSTER_SPLASH_NAME
    } = externalContext;

    const command = `kubectl scale deployment ${CLUSTER_SPLASH_NAME} --replicas=${NUMBER_REPLICAS}`;
    const options: ExecOptions = {};

    return commonHelpers.runShellCommand(command, options, (error: string) => cb(error, externalContext));
}

export function setupAutoscale (externalContext: any, cb: Function): void {
    const {
        CLUSTER_SPLASH_NAME,
        MAX_NUMBER_REPLICAS
    } = externalContext;

    const command = `kubectl autoscale deployment ${CLUSTER_SPLASH_NAME} --min=1 \\
        --max=${MAX_NUMBER_REPLICAS} \\
        --cpu-percent=60`;
    const options: ExecOptions = {};

    return commonHelpers.runShellCommand(command, options, (error: string) => cb(error, externalContext));
}

export function setupLoadbalancer (externalContext: any, cb: Function): void {
    const {
        SPLASH_EXTERNAL_PORT,
        CLUSTER_SPLASH_NAME
    } = externalContext;

    const command = `kubectl expose deployment $CLUSTER_SPLASH_NAME \
        --port=${SPLASH_EXTERNAL_PORT}  \
        --name=${CLUSTER_SPLASH_NAME} \
        --type=LoadBalancer`;
    const options: ExecOptions = {};

    return commonHelpers.runShellCommand(command, options, (error: string) => cb(error, externalContext));
}
