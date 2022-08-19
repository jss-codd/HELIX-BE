#!/bin/sh
    git stash
    git pull 
        curl -o-   https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh    | bash
    . ~/.nvm/nvm.sh
    nvm install 16.0.0
    npm install
    pm2 restart node_server
    pm2 save
    exit
EOF 