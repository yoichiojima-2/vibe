#!/usr/bin/env python3
"""Claude Desktop deployment script."""

import sys

from vibe.core import deploy_to_target


def main() -> int:
    """Deploy MCP configuration to Claude Desktop."""
    print("ℹ Claude Desktop MCP Configuration Deployment")
    deploy_to_target("claude")
    return 0


if __name__ == "__main__":
    sys.exit(main())
