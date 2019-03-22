#!/bin/bash

set -e

##########################################################################################################

# A POSIX variable
OPTIND=1         # Reset in case getopts has been used previously in the shell.

while getopts ":e:n:" opt; do
    case "$opt" in
    n)
      NODE_ENV=${OPTARG:=dev}
      #echo "-n was triggered (NODE_ENV), Parameter: $OPTARG" >&2
        ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      exit 1
      ;;
    :)
      echo "Option -$OPTARG requires an argument." >&2
      exit 1
      ;;
    esac
done

shift $((OPTIND-1))

export TAG=$(date +%Y-%m-%d)
export TRAVIS_COMMIT=$(git rev-parse HEAD)
export NODE_ENV=${NODE_ENV:=dev}

#echo "$NODE_ENV, $TAG, $TRAVIS_COMMIT, $S3_ACCESS_KEY_ID, $S3_SECRET_ACCESS_KEY, $STRIPE_PRIVATE_KEY, $MONGODB_URL, $CROWDIN_PROJECT_NAME, $CROWDIN_API_KEY"

export BUILD_ENV=prod
export ID_PROJECT=mongodb-cloud
export ZONE=europe-west1-c
export SOCKETS_PORT=3001
export EXTERNAL_PORT=80
export INTERNAL_PORT=3000
export SPLASH_EXTERNAL_PORT=8050
export CLUSTER_MACHINE_TYPE=n1-standard-1
export NUM_NODES_IN_CLUSTER=3
export MAX_NODES_IN_CLUSTER=10
export MIN_NODES_IN_CLUSTER=2
export NUMBER_REPLICAS=3
export MIN_NUMBER_REPLICAS=2
export MAX_NUMBER_REPLICAS=10
export S3_REGION=eu-west-1

export RELEASE=ds-$TAG-$NODE_ENV
export PORT=$INTERNAL_PORT
export IMAGE_NAME_CMS=$NODE_ENV-cms
export INSTANCE_NAME_CMS=$RELEASE-cms
export CLUSTER_SPLASH_NAME=$RELEASE-splash

export S3_SERVER_NAME_DEV=$S3_SERVER_NAME
export S3_REGION_DEV=$S3_REGION
export S3_SERVER_NAME=//$S3_BUCKET/

if [ -z $MONGODB_URL ]; then
  export MONGODB_URL=$MONGODB_BASE_URL/$RELEASE
  export MONGODB_URL_DEV=$MONGODB_BASE_URL_DEV/$RELEASE
fi

########################################################################################################

echo "Create instance CMS $INSTANCE_NAME_CMS"

########################################################################################################

  export INSTANCE_CMS_IP="$(gcloud compute instances list --filter="${INSTANCE_NAME_CMS}" --format="value(networkInterfaces[0].networkIP)")"

  if [ -z $INSTANCE_CMS_IP ]; then

    docker build -t gcr.io/$ID_PROJECT/$IMAGE_NAME_CMS:$TRAVIS_COMMIT \
                  --build-arg NODE_ENV=$NODE_ENV \
                  --build-arg BUILD_ENV=$BUILD_ENV \
                  --file ./deployment/dockerfiles/Dockerfile-cms .


    gcloud docker -- push gcr.io/${ID_PROJECT}/$IMAGE_NAME_CMS:$TRAVIS_COMMIT

    gcloud beta compute instances create-with-container $INSTANCE_NAME_CMS \
             --zone=$ZONE \
             --container-image=gcr.io/$ID_PROJECT/$IMAGE_NAME_CMS:$TRAVIS_COMMIT
  fi

##########################################################################################################

echo "Create cluster Splash on Google Cloud ${CLUSTER_SPLASH_NAME}"

##########################################################################################################

  export CLUSTER_SPLASH_INTERNAL_IP="$(kubectl get service $CLUSTER_SPLASH_NAME | grep $CLUSTER_SPLASH_NAME | awk '{ print $3 }')"
  export CLUSTER_SPLASH_EXTERNAL_IP="$(kubectl get service $CLUSTER_SPLASH_NAME | grep $CLUSTER_SPLASH_NAME | awk '{ print $4 }')"

  if [ -z $CLUSTER_SPLASH_INTERNAL_IP ]; then

    gcloud container clusters create $CLUSTER_SPLASH_NAME \
        --machine-type=$CLUSTER_MACHINE_TYPE \
        --zone=$ZONE \
        --num-nodes=$NUM_NODES_IN_CLUSTER \
        --enable-autoscaling \
        --max-nodes=$MAX_NODES_IN_CLUSTER \
        --min-nodes=$MIN_NODES_IN_CLUSTER

    kubectl run $CLUSTER_SPLASH_NAME \
        --image=docker.io/scrapinghub/splash \
        --replicas=$NUMBER_REPLICAS

    kubectl scale deployment $CLUSTER_SPLASH_NAME --replicas=$NUMBER_REPLICAS

    kubectl autoscale deployment $CLUSTER_SPLASH_NAME --min=1 \
        --max=$MAX_NUMBER_REPLICAS \
        --cpu-percent=60

    kubectl expose deployment $CLUSTER_SPLASH_NAME \
        --port=$SPLASH_EXTERNAL_PORT  \
        --name=${CLUSTER_SPLASH_NAME} \
        --type=LoadBalancer

    attempt_counter=0
    max_attempts=20

    while [ -n $(kubectl get service $CLUSTER_SPLASH_NAME) ]; do
        if [ ${attempt_counter} -eq ${max_attempts} ];then
          echo "Max attempts to get Cluster splash internal IP were reached"
          exit 1
        fi

        printf '.'
        attempt_counter=$(($attempt_counter+1))
        sleep 5
    done

    export CLUSTER_SPLASH_INTERNAL_IP="$(kubectl get service $CLUSTER_SPLASH_NAME | grep $CLUSTER_SPLASH_NAME | awk '{ print $3 }')"
    export CLUSTER_SPLASH_EXTERNAL_IP="$(kubectl get service $CLUSTER_SPLASH_NAME | grep $CLUSTER_SPLASH_NAME | awk '{ print $4 }')"

  fi

  echo "Get instance splash internal IP from gcloud: ${CLUSTER_SPLASH_INTERNAL_IP}, ${CLUSTER_SPLASH_EXTERNAL_IP}"

########################################################################################################

echo "Build and Push Image DS PAGES to GCP"

#########################################################################################################

  docker build -t gcr.io/$ID_PROJECT/$RELEASE:$TRAVIS_COMMIT \
                --build-arg NODE_ENV=$NODE_ENV \
                --build-arg BUILD_ENV=$BUILD_ENV \
                --file ./deployment/dockerfiles/Dockerfile-env .

  gcloud docker -- push gcr.io/$ID_PROJECT/$RELEASE:${TRAVIS_COMMIT}

##########################################################################################################

echo "Create Cluster at Google Cloud"

##########################################################################################################

  gcloud container clusters create $RELEASE \
      --machine-type=$CLUSTER_MACHINE_TYPE \
      --zone=$ZONE \
      --num-nodes=$NUM_NODES_IN_CLUSTER \
      --enable-autoscaling \
      --max-nodes=$MAX_NODES_IN_CLUSTER \
      --min-nodes=$MIN_NODES_IN_CLUSTER


###########################################################################################################

echo "Created PODs in cluster && autoscale"

###########################################################################################################

  kubectl run $RELEASE --image=gcr.io/$ID_PROJECT/$RELEASE:${TRAVIS_COMMIT} \
      --port=$INTERNAL_PORT \
      --replicas=$NUMBER_REPLICAS

  kubectl scale deployment $RELEASE --replicas=$NUMBER_REPLICAS

  kubectl autoscale deployment $RELEASE --min=$MIN_NUMBER_REPLICAS \
      --max=$MAX_NUMBER_REPLICAS \
      --cpu-percent=60

############################################################################################################

echo "Created LoadBalancer"

###########################################################################################################

  kubectl expose deployment $RELEASE --port=$EXTERNAL_PORT  \
      --target-port=$INTERNAL_PORT \
      --name=${RELEASE} \
      --type=LoadBalancer

###########################################################################################################
