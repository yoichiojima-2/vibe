#!/bin/bash

source ~/.env

MCP_SHELL="${REPO_DIR}/mcp-shell"

if [ ! -d $MCP_SHELL ]; then
    mkdir -p "$REPO_DIR"
    git clone https://github.com/sonirico/mcp-shell.git $MCP_SHELL
fi

if ! docker image inspect mcp-shell:latest > /dev/null 2>&1; then
    make -C $MCP_SHELL docker-build
fi

