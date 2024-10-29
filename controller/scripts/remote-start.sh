#!/bin/bash

# ensure one arg is provided
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 0 (starts the server) OR $0 1 (re-creates all tables)"
    exit 1
fi

# ensure arg is valid
if [ "$1" != "0" ] && [ "$1" != "1" ]; then
    echo "Usage: $0 0 (starts the server) OR $0 1 (re-creates all tables)"
    exit 1
fi

# Set Oracle environment
if [ -d /opt/oracle/instantclient_19_8 ]; then
    export ORACLE_HOME=/opt/oracle/instantclient_19_8
    export LD_LIBRARY_PATH=$ORACLE_HOME
elif [ -d /usr/lib/oracle/19.6/client64/lib ]; then
    export ORACLE_HOME=/usr/lib/oracle/19.6/client64
    # 19.* libraries will be already configured by ldconfig
    #export LD_LIBRARY_PATH=$ORACLE_HOME/lib
elif [ -d /usr/lib/oracle/12.2/client64/lib ]; then
    export ORACLE_HOME=/usr/lib/oracle/12.2/client64
    export LD_LIBRARY_PATH=$ORACLE_HOME/lib
else
    echo "Oracle not found..."
    exit 1
fi


# Configure the shared Node library on the undergrad server.
export NODE_PATH=/cs/local/generic/lib/cs304/node_modules

# File path
CURRENT_WORKING_DIR="$(dirname "$(realpath "$0")")"
ENV_SERVER_PATH="$CURRENT_WORKING_DIR/../.env"

# Check the database host name and port
sed -i "/^ORACLE_HOST=/c\ORACLE_HOST=dbhost.students.cs.ubc.ca" $ENV_SERVER_PATH
sed -i "/^ORACLE_PORT=/c\ORACLE_PORT=1522" $ENV_SERVER_PATH

# Define a range
START=50000
END=60000

# Loop through the range and check if the port is in use
for PORT in $(seq $START $END); do
    # Check if the port is in use
    if ! ss -tuln | grep :$PORT > /dev/null; then
        # Bind to the port using a temporary process
        nc -l -p $PORT &
        TEMP_PID=$!

        # Update the port number in the .env file
        sed -i "/^PORT=/c\PORT=$PORT" $ENV_SERVER_PATH
        echo "Updated $ENV_SERVER_PATH with PORT=$PORT."

        # Kill the temporary process
        kill $TEMP_PID

        # Replace the bash process with the Node process based on param
        case "$1" in
            "0")
                exec node "$CURRENT_WORKING_DIR/../build/controller/src/server.js"
                ;;
            "1")
                exec node "$CURRENT_WORKING_DIR/../build/controller/src/recreateTables.js"
                ;;
        esac
        break
    fi
done

