#!/usr/bin/env bash
# set -euo pipefail

CONTAINER_NAME="medbridges-kolab"
IMAGE_NAME="medbridges-kolab-image"
ENV_FILE=".env"
PORT=3008

echo "----- Pulling latest code -----"
# git pull

echo "----- Stopping existing container (if exists) -----"
docker stop "$CONTAINER_NAME" 2>/dev/null || true
docker rm "$CONTAINER_NAME" 2>/dev/null || true

echo "----- Building Docker image -----"
docker build -t "$IMAGE_NAME" .

echo "----- Running new container -----"
docker run -d \
  --name "$CONTAINER_NAME" \
  --env-file "$ENV_FILE" \
  -p ${PORT}:${PORT} \
  "$IMAGE_NAME"

echo "----- Deployment completed -----"
docker ps --format '{{.Names}}\t{{.Ports}}\t{{.Status}}' | grep "$CONTAINER_NAME" || true