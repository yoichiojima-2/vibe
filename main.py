#!/usr/bin/env python3

import sys
import subprocess
from pathlib import Path


def main():
    """Main entry point that provides a CLI interface to choose deployment target"""
    if len(sys.argv) > 1:
        target = sys.argv[1].lower()
        if target in ['claude', 'codex', 'gemini']:
            script_path = Path(__file__).parent / f"{target}.py"
            subprocess.run([sys.executable, str(script_path)])
            return
        elif target in ['-h', '--help']:
            print_help()
            return
        else:
            print(f"Unknown target: {target}")
            print_help()
            return 1
    
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
        
        if choice == '1':
            run_deployment('claude')
        elif choice == '2':
            run_deployment('codex')
        elif choice == '3':
            run_deployment('gemini')
        elif choice == '4':
            run_deployment('claude')
            run_deployment('codex')
            run_deployment('gemini')
        else:
            print("Invalid choice. Exiting.")
            return 1
    except KeyboardInterrupt:
        print("\nOperation cancelled.")
        return 1


def run_deployment(target):
    """Run deployment for a specific target"""
    script_path = Path(__file__).parent / f"{target}.py"
    subprocess.run([sys.executable, str(script_path)])


def print_help():
    """Print help message"""
    print("Usage: vibe [target]")
    print()
    print("Targets:")
    print("  claude    Deploy to Claude Desktop")
    print("  codex     Deploy to Codex CLI")
    print("  gemini    Deploy to Gemini")
    print()
    print("Run without arguments for interactive mode.")


if __name__ == "__main__":
    exit(main())
