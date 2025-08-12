#!/usr/bin/env bash

# Generate MCP configuration with environment variable substitution

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_FILE="${SCRIPT_DIR}/mcp-settings.template.json"
OUTPUT_FILE="${SCRIPT_DIR}/mcp-settings.json"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_error() {
    echo -e "${RED}✗ Error: $1${NC}" >&2
}

log_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

log_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if template exists
if [[ ! -f "$TEMPLATE_FILE" ]]; then
    log_error "Template file not found: $TEMPLATE_FILE"
    exit 1
fi

# Load secrets if available
SECRETS_FILE="${SCRIPT_DIR}/secrets.sh"
if [[ -f "$SECRETS_FILE" ]]; then
    source "$SECRETS_FILE"
fi

# Check if OPENAI_API_KEY is available
if [[ -z "${OPENAI_API_KEY:-}" ]]; then
    log_error "OPENAI_API_KEY environment variable not set"
    log_info "Run the following to set up secrets:"
    log_info "  source ${SCRIPT_DIR}/secrets.sh"
    log_info "  secret_setup"
    exit 1
fi

# Generate config with environment variable substitution
log_info "Generating MCP configuration from template..."

# Use envsubst to substitute environment variables
if command -v envsubst >/dev/null 2>&1; then
    envsubst < "$TEMPLATE_FILE" > "$OUTPUT_FILE"
else
    # Fallback: simple sed replacement for common variables
    sed "s/\$OPENAI_API_KEY/${OPENAI_API_KEY}/g" "$TEMPLATE_FILE" > "$OUTPUT_FILE"
fi

# Validate the generated JSON
if command -v python3 >/dev/null 2>&1; then
    if python3 -m json.tool "$OUTPUT_FILE" >/dev/null 2>&1; then
        log_success "Generated valid MCP configuration: $OUTPUT_FILE"
    else
        log_error "Generated invalid JSON configuration"
        rm -f "$OUTPUT_FILE"
        exit 1
    fi
else
    log_success "Generated MCP configuration: $OUTPUT_FILE"
    log_info "Install python3 for JSON validation"
fi

# Show the user what was generated
log_info "API key configured for o3-search server"