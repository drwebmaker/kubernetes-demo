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

export function createInstanceDs (externalContext: any, cb: Function): void {

    const {
        ID_PROJECT,
        RELEASE,
        TRAVIS_COMMIT,
        BUILD_ENV,
        NODE_ENV
    } = externalContext;


    const command = `docker build -t gcr.io/${ID_PROJECT}/${RELEASE}:${TRAVIS_COMMIT} \
                --build-arg NODE_ENV=${NODE_ENV} \
                --build-arg BUILD_ENV=${BUILD_ENV} \
                --file ./deployment/dockerfiles/Dockerfile-env .`;

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

export function pushImageDs (externalContext: any, cb: Function): void {

    const {
        ID_PROJECT,
        RELEASE,
        TRAVIS_COMMIT
    } = externalContext;

    const command = `gcloud docker -- push gcr.io/${ID_PROJECT}/${RELEASE}:${TRAVIS_COMMIT}`;
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

export function getClusterSplachInternalIp(externalContext: any, cb: Function) {
    const {
        CLUSTER_SPLASH_NAME
    } = externalContext;

    const command = `kubectl get service ${CLUSTER_SPLASH_NAME} | grep ${CLUSTER_SPLASH_NAME} | awk '{ print $3 }')`;
    const options: ExecOptions = {};

    return commonHelpers.runShellCommand(command, options, (error: string) => cb(error, externalContext));
}


export function getClusterSplachExternalIp(externalContext: any, cb: Function) {
    const {
        CLUSTER_SPLASH_NAME
    } = externalContext;

    const command = `kubectl get service ${CLUSTER_SPLASH_NAME} | grep ${CLUSTER_SPLASH_NAME} | awk '{ print $4 }')`;
    const options: ExecOptions = {};

    return commonHelpers.runShellCommand(command, options, (error: string) => cb(error, externalContext));
}

export function createClusterSplash (externalContext: any, cb: Function): void {
    const {
        CLUSTER_SPLASH_NAME,
        CLUSTER_MACHINE_TYPE,
        ZONE,
        NUM_NODES_IN_CLUSTER,
        MAX_NODES_IN_CLUSTER,
        MIN_NODES_IN_CLUSTER
    } = externalContext;

    const command = `gcloud container clusters create ${CLUSTER_SPLASH_NAME} \
        --machine-type=${CLUSTER_MACHINE_TYPE} \
        --zone=${ZONE} \
        --num-nodes=${NUM_NODES_IN_CLUSTER} \
        --enable-autoscaling \
        --max-nodes=${MAX_NODES_IN_CLUSTER} \
        --min-nodes=${MIN_NODES_IN_CLUSTER}`;
    const options: ExecOptions = {};

    return commonHelpers.runShellCommand(command, options, (error: string) => cb(error, externalContext));
}

export function createCluster (externalContext: any, cb: Function): void {
    const {
        RELEASE,
        CLUSTER_MACHINE_TYPE,
        ZONE,
        NUM_NODES_IN_CLUSTER,
        MAX_NODES_IN_CLUSTER,
        MIN_NODES_IN_CLUSTER
    } = externalContext;

    const command = `gcloud container clusters create ${RELEASE} \
      --machine-type=${CLUSTER_MACHINE_TYPE} \
      --zone=${ZONE} \
      --num-nodes=${NUM_NODES_IN_CLUSTER} \
      --enable-autoscaling \
      --max-nodes=${MAX_NODES_IN_CLUSTER} \
      --min-nodes=${MIN_NODES_IN_CLUSTER}`;
    const options: ExecOptions = {};

    return commonHelpers.runShellCommand(command, options, (error: string) => cb(error, externalContext));
}

export function createPods (externalContext: any, cb: Function): void {
    const {
        ID_PROJECT,
        RELEASE,
        TRAVIS_COMMIT,
        INTERNAL_PORT,
        NUMBER_REPLICAS
    } = externalContext;

    const command = `kubectl run $RELEASE --image=gcr.io/${ID_PROJECT}/${RELEASE}:${TRAVIS_COMMIT} \
      --port=${INTERNAL_PORT} \
      --replicas=${NUMBER_REPLICAS}`;
    const options: ExecOptions = {};

    return commonHelpers.runShellCommand(command, options, (error: string) => cb(error, externalContext));
}

export function createPodsSplash (externalContext: any, cb: Function): void {
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

export function createReplicasSplash (externalContext: any, cb: Function): void {
    const {
        NUMBER_REPLICAS,
        CLUSTER_SPLASH_NAME
    } = externalContext;

    const command = `kubectl scale deployment ${CLUSTER_SPLASH_NAME} --replicas=${NUMBER_REPLICAS}`;
    const options: ExecOptions = {};

    return commonHelpers.runShellCommand(command, options, (error: string) => cb(error, externalContext));
}

export function createReplicas (externalContext: any, cb: Function): void {
    const {
        NUMBER_REPLICAS,
        RELEASE
    } = externalContext;

    const command = `kubectl scale deployment ${RELEASE} --replicas=${NUMBER_REPLICAS}`;
    const options: ExecOptions = {};

    return commonHelpers.runShellCommand(command, options, (error: string) => cb(error, externalContext));
}

export function setupAutoscaleSplash (externalContext: any, cb: Function): void {
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

export function setupAutoscale (externalContext: any, cb: Function): void {
    const {
        RELEASE,
        MAX_NUMBER_REPLICAS,
        MIN_NUMBER_REPLICAS
    } = externalContext;

    const command = `kubectl autoscale deployment ${RELEASE} --min=${MIN_NUMBER_REPLICAS} \
      --max=${MAX_NUMBER_REPLICAS} \
      --cpu-percent=60`;
    const options: ExecOptions = {};

    return commonHelpers.runShellCommand(command, options, (error: string) => cb(error, externalContext));
}

export function setupLoadbalancerSplash (externalContext: any, cb: Function): void {
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

export function setupLoadbalancer (externalContext: any, cb: Function): void {
    const {
        EXTERNAL_PORT,
        INTERNAL_PORT,
        RELEASE
    } = externalContext;

    const command = `kubectl expose deployment $RELEASE --port=${EXTERNAL_PORT}  \
      --target-port=${INTERNAL_PORT} \
      --name=${RELEASE} \
      --type=LoadBalancer`;
    const options: ExecOptions = {};

    return commonHelpers.runShellCommand(command, options, (error: string) => cb(error, externalContext));
}

export function getClusterSplash(externalContext: any): any {
    const {
        CLUSTER_SPLASH_NAME
    } = externalContext;

    const command = `kubectl get service ${CLUSTER_SPLASH_NAME}`;
    const options: ExecOptions = {};

    runSellCommandWrapper(command, options);
}

function runSellCommandWrapper(command, options) {

    return new Promise((resolve, reject) => {
        return commonHelpers.runShellCommand(command, options, (error: string) => (error: string, result: any): void => {
            if (error) {
                return reject(error);
            }
            return resolve(result);
        });
    });
}
