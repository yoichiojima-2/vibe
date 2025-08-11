#!/usr/bin/env python3
"""Codex CLI deployment script."""

import sys

from vibe.core import deploy_to_target


def main() -> int:
    """Deploy MCP configuration to Codex CLI."""
    print("ℹ Codex CLI MCP Configuration Deployment")
    deploy_to_target("codex")
    return 0


if __name__ == "__main__":
    sys.exit(main())
