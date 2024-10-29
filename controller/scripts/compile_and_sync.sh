#!/bin/bash
set -e

CURRENT_WORKING_DIR="$(dirname "$(realpath "$0")")"
ENV_FILE_PATH=$CURRENT_WORKING_DIR/../.env
BACKEND_FILE_PATH=$CURRENT_WORKING_DIR/../

# load env vars
if [ -f $ENV_FILE_PATH ]; then
    source $ENV_FILE_PATH
else
    echo ".env file not found!"
    exit 1
fi

# updates node_modules and build directories
cd $CURRENT_WORKING_DIR/../
rm -rf ./build/*
npm install
npm run compile

# sync node_modules and build directories with remote
rsync -avz --delete $BACKEND_FILE_PATH $UGRAD_CWL@$UGRAD_SERVER:$UGRAD_BACKEND_FILE_PATH
