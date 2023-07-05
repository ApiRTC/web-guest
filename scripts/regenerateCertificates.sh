#!/bin/bash

echo -e "\033[1m### Certificates will be regenerates\033[0m"

if [[ -d "./.cert" ]]; then
    echo -e "\033[1m### Remove old certificates\033[0m" &&

    if [[ -n $(ls ./.cert | grep "RootCA*") ]]; then
        rm ./.cert/RootCA.*
    fi

    if [[ -n $(ls ./.cert | grep "localhost*") ]]; then
        rm ./.cert/localhost*
    fi
else
    mkdir "./.cert"
fi

echo -e "\033[1m### Generates new certificates\033[0m" &&
cd "./.cert" &&
openssl req -x509 -nodes -new -sha256 -days 1024 -newkey rsa:2048 -keyout RootCA.key -out RootCA.pem -subj "/C=FR/CN=WebAssisted-Localhost-Root-CA" && 
openssl x509 -outform pem -in RootCA.pem -out RootCA.crt && 
openssl req -new -nodes -newkey rsa:2048 -keyout localhost.key -out localhost.csr -subj "/C=FR/ST=Cotes d'Armor/L=Lannion/O=WebAssisted-Localhost-Certificate/CN=localhost.local" && 
openssl x509 -req -sha256 -days 1024 -in localhost.csr -CA RootCA.pem -CAkey RootCA.key -CAcreateserial -extfile domains.ext -out localhost.crt &&
echo -e "\033[1;32m### Certificates successfully regenerates\033[0m" ||
echo -e "\033[1;31m### Error during certificates generation\033[0m"