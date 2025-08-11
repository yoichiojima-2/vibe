"""Command-line interface for vibe deployment tools."""

import argparse
import sys
from typing import Optional

from .core import DEPLOYMENT_TARGETS, deploy_to_target


def create_parser() -> argparse.ArgumentParser:
    """Create the argument parser."""
    parser = argparse.ArgumentParser(
        prog="vibe",
        description="Deploy MCP configurations to AI coding assistants",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  vibe claude           Deploy to Claude Desktop
  vibe codex            Deploy to Codex CLI
  vibe gemini           Deploy to Gemini
  vibe all              Deploy to all targets
  vibe -v claude        Deploy with verbose output
        """,
    )

    parser.add_argument(
        "target",
        choices=list(DEPLOYMENT_TARGETS.keys()) + ["all"],
        help="Deployment target or 'all' for all targets",
    )

    parser.add_argument("-v", "--verbose", action="store_true", help="Enable verbose output")

    return parser


def main_interactive() -> int:
    """Interactive mode for choosing deployment target."""
    print("🎵 Vibe - MCP Configuration Deployment")
    print()
    print("Choose a deployment target:")
    print("1. Claude Desktop")
    print("2. Codex CLI")
    print("3. Gemini")
    print("4. All targets")
    print()

    try:
        choice = input("Enter your choice (1-4): ").strip()

        if choice == "1":
            deploy_to_target("claude")
        elif choice == "2":
            deploy_to_target("codex")
        elif choice == "3":
            deploy_to_target("gemini")
        elif choice == "4":
            for target in DEPLOYMENT_TARGETS:
                deploy_to_target(target)
        else:
            print("Invalid choice. Exiting.")
            return 1

        return 0

    except KeyboardInterrupt:
        print("\nOperation cancelled.")
        return 1


def main(args: Optional[list[str]] = None) -> int:
    """Main entry point for the CLI."""
    if not args and len(sys.argv) == 1:
        # No arguments provided, use interactive mode
        return main_interactive()

    parser = create_parser()
    parsed_args = parser.parse_args(args)

    if parsed_args.target == "all":
        for target in DEPLOYMENT_TARGETS:
            deploy_to_target(target, parsed_args.verbose)
    else:
        deploy_to_target(parsed_args.target, parsed_args.verbose)

    return 0


if __name__ == "__main__":
    sys.exit(main())
