#!/bin/bash

main() {
    cp settings.json "${HOME}/.gemini/settings.json"
    echo done: $0
}

main
