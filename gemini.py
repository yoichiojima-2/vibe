#!/usr/bin/env python3
"""Gemini deployment script."""

import sys

from vibe.core import deploy_to_target


def main() -> int:
    """Deploy MCP configuration to Gemini."""
    print("ℹ Gemini MCP Configuration Deployment")
    deploy_to_target("gemini")
    return 0


if __name__ == "__main__":
    sys.exit(main())
