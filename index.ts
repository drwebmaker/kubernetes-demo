import * as async from 'async';
import { GCloudArguments } from './interfaces';
import { checkDockerTool, checkGcloudTool, getContextInstance } from './common.helpers';
// import { loggerFactory } from '../ws.config/log';
// import { DEFAULT_CONFIG } from './deployment_config.default';
import { createRedis } from './redis.helpers'
import * as _ from 'lodash';

import {
    getGcpInstances,
    createClusterSplash,
    createCluster,
    createPodsSplash,
    createPods,
    setupAutoscaleSplash,
    setupAutoscale,
    setupLoadbalancerSplash,
    setupLoadbalancer,
    pushImageTM,
    createReplicasSplash,
    createReplicas,
    getClusterSplachInternalIp,
    getClusterSplachExternalIp,
    createInstanceCms,
    createInstanceDs,
    pushImageDs,
    getClusterSplash
} from './deploy.helpers';


// Default variables
const packageJson = require('./package.json');
const DEFAULT_CONFIG = require('./deployment_config.default.json');

function setupEnvironment(): any {
    const {
        DEFAULT_NODE_ENV,
        DEFAULT_BUILD_ENV,
        DEFAULT_ID_PROJECT,
        DEFAULT_ZONE,
        DEFAULT_SOCKETS_PORT,
        DEFAULT_EXTERNAL_PORT,
        DEFAULT_INTERNAL_PORT,
        DEFAULT_SPLASH_EXTERNAL_PORT,
        DEFAULT_CLUSTER_MACHINE_TYPE,
        DEFAULT_NUM_NODES_IN_CLUSTER,
        DEFAULT_MAX_NODES_IN_CLUSTER,
        DEFAULT_MIN_NODES_IN_CLUSTER,
        DEFAULT_NUMBER_REPLICAS,
        DEFAULT_MIN_NUMBER_REPLICAS,
        DEFAULT_MAX_NUMBER_REPLICAS,
        DEFAULT_S3_REGION
    } = DEFAULT_CONFIG; // placed it here for testing purpose


    const d = new Date();
    const TAG = `${d.getFullYear()}-${(d.getMonth()+1)}-${d.getDate()}`;
    const TRAVIS_COMMIT = $(git rev-parse HEAD)
    const RELEASE = `ds-${TAG}-${DEFAULT_NODE_ENV}`;
    const PORT = DEFAULT_INTERNAL_PORT;
    const IMAGE_NAME_CMS = `${DEFAULT_NODE_ENV}-cms`;
    const INSTANCE_NAME_CMS = `${RELEASE}-cms`;
    const CLUSTER_SPLASH_NAME = `${RELEASE}-splash`;

    const NODE_ENV = process.env.NODE_ENV || DEFAULT_NODE_ENV;
    const BUILD_ENV = process.env.BUILD_ENV || DEFAULT_BUILD_ENV;
    const ID_PROJECT = process.env.ID_PROJECT || DEFAULT_ID_PROJECT;
    const ZONE = process.env.ZONE || DEFAULT_ZONE;
    const SOCKETS_PORT = process.env.SOCKETS_PORT || DEFAULT_SOCKETS_PORT;
    const EXTERNAL_PORT = process.env.EXTERNAL_PORT || DEFAULT_EXTERNAL_PORT;
    const INTERNAL_PORT = process.env.INTERNAL_PORT || DEFAULT_INTERNAL_PORT;
    const SPLASH_EXTERNAL_PORT = process.env.SPLASH_EXTERNAL_PORT || DEFAULT_SPLASH_EXTERNAL_PORT;
    const CLUSTER_MACHINE_TYPE = process.env.CLUSTER_MACHINE_TYPE || DEFAULT_CLUSTER_MACHINE_TYPE;
    const NUM_NODES_IN_CLUSTER = process.env.NUM_NODES_IN_CLUSTER || DEFAULT_NUM_NODES_IN_CLUSTER;
    const MAX_NODES_IN_CLUSTER = process.env.MAX_NODES_IN_CLUSTER || DEFAULT_MAX_NODES_IN_CLUSTER;
    const MIN_NODES_IN_CLUSTER = process.env.MIN_NODES_IN_CLUSTER || DEFAULT_MIN_NODES_IN_CLUSTER;
    const NUMBER_REPLICAS = process.env.NUMBER_REPLICAS || DEFAULT_NUMBER_REPLICAS;
    const MIN_NUMBER_REPLICAS = process.env.MIN_NUMBER_REPLICAS || DEFAULT_MIN_NUMBER_REPLICAS;
    const MAX_NUMBER_REPLICAS = process.env.MAX_NUMBER_REPLICAS || DEFAULT_MAX_NUMBER_REPLICAS;
    const S3_REGION = process.env.S3_REGION || DEFAULT_S3_REGION;


    const primaryContext = {
        TAG,
        TRAVIS_COMMIT,
        RELEASE,
        PORT,
        IMAGE_NAME_CMS,
        INSTANCE_NAME_CMS,
        CLUSTER_SPLASH_NAME,
        NODE_ENV,
        BUILD_ENV,
        ID_PROJECT,
        ZONE,
        SOCKETS_PORT,
        EXTERNAL_PORT,
        INTERNAL_PORT,
        SPLASH_EXTERNAL_PORT,
        CLUSTER_MACHINE_TYPE,
        NUM_NODES_IN_CLUSTER,
        MAX_NODES_IN_CLUSTER,
        MIN_NODES_IN_CLUSTER,
        NUMBER_REPLICAS,
        MIN_NUMBER_REPLICAS,
        MAX_NUMBER_REPLICAS,
        S3_REGION
        };

    // Computed variables
    const NODE_ENV = process.env.NODE_ENV || DEFAULT_NODE_ENV;
    const ENVIRONMENT = DEFAULT_ENVIRONMENTS[NODE_ENV] || NODE_ENV;
    const VERSION_TAG = process.env.VERSION || (packageJson as any).version;
    const VERSION = VERSION_TAG.replace(/\./g, '-');
    const CONFIG_PATH = `${DEFAULT_PATH_TO_CONFIG_FILE}${NODE_ENV}.json`;
    const STATIC_VARIABLES = require(CONFIG_PATH);

    const givenStaticVariables = _.keys(STATIC_VARIABLES);
    const requiredStaticVariables = _.difference(DEFAULT_REQUIRED_PARAMETERS, givenStaticVariables);

    if (!_.isEmpty(requiredStaticVariables)) {
        throw new Error(`Failed to find required variables in file ${CONFIG_PATH}: ${requiredStaticVariables}`);
    }

    const DEFAULT_REGION = STATIC_VARIABLES.REGION || DEFAULT_GCP_VARIABLES.DEFAULT_REGION;
    const REDIS_REGION = STATIC_VARIABLES.REDIS_REGION || DEFAULT_REGION;
    const TM_REGION = STATIC_VARIABLES.TM_REGION || DEFAULT_REGION;
    const LB_REGION = STATIC_VARIABLES.LB_REGION || DEFAULT_REGION;

    const TM_MACHINE_TYPE = STATIC_VARIABLES.TM_MACHINE_TYPE || DEFAULT_MACHINE_TYPES.TM;
    const WS_MACHINE_TYPE = STATIC_VARIABLES.WS_MACHINE_TYPE || DEFAULT_MACHINE_TYPES.WS;
    const REDIS_MACHINE_TYPE = STATIC_VARIABLES.REDIS_MACHINE_TYPE || DEFAULT_MACHINE_TYPES.REDIS;

    const TM_DISK_SIZE = STATIC_VARIABLES.TM_DISK_SIZE || DEFAULT_DISK_SIZES.TM;
    const WS_DISK_SIZE = STATIC_VARIABLES.WS_DISK_SIZE || DEFAULT_DISK_SIZES.WS;
    const REDIS_DISK_SIZE = STATIC_VARIABLES.REDIS_DISK_SIZE || DEFAULT_DISK_SIZES.REDIS;

    const MAX_NODES_PER_POOL = STATIC_VARIABLES.MAX_NODES_PER_POOL || DEFAULT_GCP_VARIABLES.MAX_NODES_PER_POOL;
    const MAX_NODES = STATIC_VARIABLES.MAX_NODES || DEFAULT_GCP_VARIABLES.MAX_NODES;
    const MIN_NODES = STATIC_VARIABLES.MIN_NODES || DEFAULT_GCP_VARIABLES.MIN_NODES;
    const NUM_NODES = STATIC_VARIABLES.NUM_NODES || DEFAULT_GCP_VARIABLES.NUM_NODES;
    const MAX_NUMBER_REPLICAS = STATIC_VARIABLES.MAX_NUMBER_REPLICAS || DEFAULT_GCP_VARIABLES.MAX_NUMBER_REPLICAS;
    const MIN_NUMBER_REPLICAS = STATIC_VARIABLES.MIN_NUMBER_REPLICAS || DEFAULT_GCP_VARIABLES.MIN_NUMBER_REPLICAS;
    const NUMBER_REPLICAS = STATIC_VARIABLES.NUMBER_REPLICAS || DEFAULT_GCP_VARIABLES.NUMBER_REPLICAS;
    const REPLICAS_REQUESTS = STATIC_VARIABLES.REPLICAS_REQUESTS || DEFAULT_GCP_VARIABLES.REPLICAS_REQUESTS;
    const CPU_PERCENT = STATIC_VARIABLES.CPU_PERCENT || DEFAULT_GCP_VARIABLES.CPU_PERCENT;


    const COMPUTED_VARIABLES = Object.assign({
        NODE_ENV,
        ENVIRONMENT,
        STACK_NAME: `${NODE_ENV}-stack-${VERSION}`,
        RELEASE_DATE: (new Date()).toISOString(),
        VERSION,
        // VERSION_TAG
    }, STATIC_VARIABLES);

    // gcloud variables
    const GCP_VARIABLES = Object.assign(DEFAULT_GCP_VARIABLES, {
        PROJECT_ID: `${NODE_ENV}-${STATIC_VARIABLES.DEFAULT_PROJECT_NAME}`,
        PROJECT_LABELS: `environment=${NODE_ENV}`,
        CLUSTER_NAME: `${NODE_ENV}-cluster-${VERSION}`,
        NAME_SPACE_NODE: `${NODE_ENV}-namespace-${VERSION}`,
        REDIS_INSTANCE_NAME: `${NODE_ENV}-redis-${VERSION}`,

        REPLICAS_NAME: `${NODE_ENV}-replicas-${VERSION}`,
        LOAD_BALANCER_NAME: `${NODE_ENV}-lb-${VERSION}`,
        FIREWALL_RULE__ALLOW_HTTP: `${NODE_ENV}-allow-http-${VERSION}`,
        FIREWALL_RULE__ALLOWED_PORTS: STATIC_VARIABLES.FIREWALL_RULE__ALLOWED_PORTS || DEFAULT_GCP_VARIABLES.FIREWALL_RULE__ALLOWED_PORTS,

        REGION: DEFAULT_REGION,
        REDIS_REGION,
        TM_REGION,
        LB_REGION,

        TM_MACHINE_TYPE,
        WS_MACHINE_TYPE,
        REDIS_MACHINE_TYPE,

        TM_DISK_SIZE,
        WS_DISK_SIZE,
        REDIS_DISK_SIZE,

        MAX_NODES_PER_POOL,
        MAX_NODES,
        MIN_NODES,
        NUM_NODES,
        MAX_NUMBER_REPLICAS,
        MIN_NUMBER_REPLICAS,
        NUMBER_REPLICAS,
        REPLICAS_REQUESTS,
        CPU_PERCENT,

        ZONE: `${ DEFAULT_REGION }-c`,
        REDIS_ZONE: `${ REDIS_REGION }-c`,
        TM_ZONE: `${ TM_REGION }-c`,
        LB_ZONE: `${ LB_REGION }-c`,

        MACHINE_TYPES: Object.assign({}, DEFAULT_MACHINE_TYPES)
    });

    // const primaryContext = Object.assign({
    //     COMPUTED_VARIABLES,
    //     DEFAULT_MACHINE_TYPES,
    //     DEFAULT_IMAGE_NAME_SUFFIXES,
    //     DEFAULT_TM_PORTS,
    //     DEFAULT_WS_PORTS,
    //     DEFAULT_GCP_API
    // }, GCP_VARIABLES);

    const contextTM: GCloudArguments = getContextInstance(primaryContext, 'TM');
    const contextNode: GCloudArguments = getContextInstance(primaryContext, 'WS'); // 'WS'

    // return Object.assign(primaryContext, {
    //     TM_INSTANCE_VARIABLES: contextTM,
    //     NODE_INSTANCE_VARIABLES: contextNode
    // });

    return primaryContext;
}

export async function run() {
    const context = await setupEnvironment();

    const gcp_instances = await getGcpInstances(context, ()=>{});

    if (_.isEmpty(gcp_instances)) {
        await createInstanceCms(context, ()=>{});
        await pushImageTM(context, ()=>{});
        await createRedis(context, ()=>{});
    }
    await getClusterSplachExternalIp(context, ()=>{});

    const clusterSplachIngernalIp = await getClusterSplachInternalIp(context, ()=>{});
    if (_.isEmpty(clusterSplachIngernalIp)) {
        await createClusterSplash(context, ()=>{});
        await createPodsSplash(context, ()=>{});
        await createReplicasSplash(context, ()=>{});
        await setupAutoscaleSplash(context, ()=>{});
        await setupLoadbalancerSplash(context, ()=>{});


        let attempt_counter=0;
        const max_attempts=20;
        const clusterSplash = await getClusterSplash(context);
        while (clusterSplash.length === 0) {
            if(attempt_counter === max_attempts) {
                throw new Error('Max attempts to get Cluster splash internal IP were reached');
            }
            attempt_counter++;
            _.delay(getClusterSplash, 5000, [context]);
        }

        getClusterSplachInternalIp(context, ()=>{});
        getClusterSplachExternalIp(context, ()=>{});
    }

    await createInstanceDs (context, ()=>{});
    await pushImageDs (context, ()=>{});

    await createCluster (context, ()=>{});
    await createPods (context, ()=>{});
    await createReplicas (context, ()=>{});
    await setupAutoscale (context, ()=>{});
    await setupLoadbalancer (context, ()=>{});



    return new Promise((resolve: Function, reject: Function) => {
        const context = setupEnvironment();
        const GCP_STACK_ACTION = process.env.GCP_STACK_ACTION;

        // const logger = loggerFactory.createLogger({environment: context.COMPUTED_VARIABLES.NODE_ENV, loggerName: GCP_STACK_ACTION});
        // const prepareTools = process.env.FORCE === 'true'
        //     ? []
        //     : [
        //         checkDockerTool,
        //         checkGcloudTool,
        //         setDefaultUser,
        //         createProject,
        //         setDefaultProject,
        //         async.apply(setupAPIs, ['cloudbilling.googleapis.com'], { action: 'enable' }),
        //         linkProjectToBilling,
        //         async.apply(setupAPIs, context.DEFAULT_GCP_API, { action: 'enable' }),
        //         setupGcloudContainerConfig,
        //         buildImageNode,
        //         pushImageNode
        //     ];

        // async.waterfall([
        //     async.constant(context),
        //     buildImageNode,
        //     pushImageNode,
        //     createCluster,
        //     createPods,
        //     setupAutoscale,
        //     setupLoadbalancer,
        //     getLoadbalancerExternalIP,
        //     printExternalIPs
        // ], function (error: string, result: any): void {
        //     if (error) {
        //         // logger.error(error);
        //         return reject(error);
        //     }
        //
        //     return resolve();
        // });
    });
}

