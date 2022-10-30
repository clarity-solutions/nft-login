#!/bin/bash -eux

cd $(dirname "$0")/..

cp node_modules/@picocss/pico/css/pico.min.css public/
cp node_modules/web3/dist/web3.min.js public/
