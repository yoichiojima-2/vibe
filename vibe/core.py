"""Core utilities and configuration management for vibe."""

import json
import logging
import os
import shutil
from datetime import datetime
from pathlib import Path
from typing import Optional, Union

logger = logging.getLogger(__name__)


class VibeError(Exception):
    """Base exception for vibe operations."""

    pass


class ConfigurationError(VibeError):
    """Raised when configuration is invalid or missing."""

    pass


class DeploymentError(VibeError):
    """Raised when deployment operations fail."""

    pass


def setup_logging(verbose: bool = False) -> None:
    """Configure logging for the application."""
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level, format="%(levelname)s: %(message)s", handlers=[logging.StreamHandler()]
    )


def find_dotfiles_directory() -> Path:
    """Find the dotfiles directory containing MCP configurations."""
    dotfiles_env = os.environ.get("DOTFILES_DIR")
    if dotfiles_env and Path(dotfiles_env).exists():
        logger.debug(f"Using dotfiles directory from environment: {dotfiles_env}")
        return Path(dotfiles_env)

    search_locations = [
        Path.home() / "Developer/repo/dotfiles",
        Path.home() / ".dotfiles",
        Path.home() / "dotfiles",
    ]

    for location in search_locations:
        if location.exists():
            logger.debug(f"Found dotfiles directory: {location}")
            return location

    raise ConfigurationError(
        f"Could not locate dotfiles directory. Searched: {[str(loc) for loc in search_locations]}"
    )


def create_backup(file_path: Path) -> Optional[Path]:
    """Create a timestamped backup of an existing file."""
    if not file_path.exists():
        logger.debug(f"No existing file to backup: {file_path}")
        return None

    backup_dir = file_path.parent / "backups"
    backup_dir.mkdir(exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = backup_dir / f"{file_path.name}.backup.{timestamp}"

    try:
        shutil.copy2(file_path, backup_path)
        logger.info(f"✓ Backed up to: {backup_path.name}")
        return backup_path
    except OSError as e:
        raise DeploymentError(f"Failed to create backup: {e}") from e


def load_mcp_settings(dotfiles_dir: Path) -> dict[str, any]:
    """Load and validate MCP settings from dotfiles directory."""
    settings_file = dotfiles_dir / "mcp-settings.json"

    if not settings_file.exists():
        raise ConfigurationError(f"MCP settings file not found: {settings_file}")

    try:
        with open(settings_file, encoding="utf-8") as f:
            data = json.load(f)
        logger.debug(f"Loaded MCP settings from {settings_file}")
        return data
    except json.JSONDecodeError as e:
        raise ConfigurationError(f"Invalid JSON in {settings_file}: {e}") from e
    except OSError as e:
        raise ConfigurationError(f"Failed to read {settings_file}: {e}") from e


def convert_mcp_to_toml(mcp_servers: dict[str, dict[str, any]]) -> str:
    """Convert MCP servers configuration from JSON to TOML format."""
    if not mcp_servers:
        raise ConfigurationError("No MCP servers found in configuration")

    toml_lines = []

    for server_name, config in mcp_servers.items():
        toml_lines.append(f"[mcp_servers.{server_name}]")

        if "command" in config:
            command = config["command"].replace('"', '\\"')
            toml_lines.append(f'command = "{command}"')

        if "args" in config and isinstance(config["args"], list):
            args = ", ".join(f'"{arg}"' for arg in config["args"])
            toml_lines.append(f"args = [{args}]")

        if "env" in config and isinstance(config["env"], dict):
            env_pairs = ", ".join(f'"{k}" = "{v}"' for k, v in config["env"].items())
            toml_lines.append(f"env = {{ {env_pairs} }}")

        toml_lines.append("")  # Empty line between servers

    return "\n".join(toml_lines)


class DeploymentTarget:
    """Base class for deployment targets."""

    def __init__(self, name: str, config_path: Path):
        self.name = name
        self.config_path = config_path

    def deploy(self, source_data: Union[str, dict[str, any]]) -> None:
        """Deploy configuration to target."""
        raise NotImplementedError

    def _ensure_config_directory(self) -> None:
        """Ensure the configuration directory exists."""
        self.config_path.parent.mkdir(parents=True, exist_ok=True)

    def _deploy_file(self, source_path: Path) -> None:
        """Deploy a file by copying it to the target location."""
        self._ensure_config_directory()
        create_backup(self.config_path)

        try:
            shutil.copy2(source_path, self.config_path)
            logger.info(f"✓ Configuration deployed to {self.name}")
            logger.info(f"ℹ Location: {self.config_path}")
        except OSError as e:
            raise DeploymentError(f"Failed to deploy to {self.name}: {e}") from e

    def _deploy_content(self, content: str) -> None:
        """Deploy string content to the target location."""
        self._ensure_config_directory()
        create_backup(self.config_path)

        try:
            self.config_path.write_text(content, encoding="utf-8")
            logger.info(f"✓ Configuration deployed to {self.name}")
            logger.info(f"ℹ Location: {self.config_path}")
        except OSError as e:
            raise DeploymentError(f"Failed to deploy to {self.name}: {e}") from e


class ClaudeTarget(DeploymentTarget):
    """Claude Desktop deployment target."""

    def __init__(self):
        config_path = Path.home() / "Library/Application Support/Claude/claude_desktop_config.json"
        super().__init__("Claude Desktop", config_path)

    def deploy(self, source_data: Union[str, dict[str, any]]) -> None:
        if isinstance(source_data, str):
            # Assume it's a file path
            self._deploy_file(Path(source_data))
        else:
            # Assume it's JSON data
            content = json.dumps(source_data, indent=2)
            self._deploy_content(content)


class CodexTarget(DeploymentTarget):
    """Codex CLI deployment target."""

    def __init__(self):
        config_path = Path.home() / ".codex/config.toml"
        super().__init__("Codex CLI", config_path)

    def deploy(self, source_data: Union[str, dict[str, any]]) -> None:
        if isinstance(source_data, dict):
            mcp_servers = source_data.get("mcpServers", {})
            content = convert_mcp_to_toml(mcp_servers)
            self._deploy_content(content)
            logger.info(f"✓ Deployed {len(mcp_servers)} MCP servers to {self.name}")
        else:
            raise DeploymentError("Codex deployment requires MCP server configuration")


class GeminiTarget(DeploymentTarget):
    """Gemini deployment target."""

    def __init__(self):
        config_path = Path.home() / ".gemini/settings.json"
        super().__init__("Gemini", config_path)

    def deploy(self, source_data: Union[str, dict[str, any]]) -> None:
        if isinstance(source_data, str):
            # Assume it's a file path
            self._deploy_file(Path(source_data))
        else:
            # Assume it's JSON data
            content = json.dumps(source_data, indent=2)
            self._deploy_content(content)


DEPLOYMENT_TARGETS = {
    "claude": ClaudeTarget,
    "codex": CodexTarget,
    "gemini": GeminiTarget,
}


def get_deployment_target(target_name: str) -> DeploymentTarget:
    """Get a deployment target by name."""
    if target_name not in DEPLOYMENT_TARGETS:
        available = ", ".join(DEPLOYMENT_TARGETS.keys())
        raise ConfigurationError(f"Unknown target: {target_name}. Available: {available}")

    return DEPLOYMENT_TARGETS[target_name]()


def deploy_to_target(target_name: str, verbose: bool = False) -> None:
    """Deploy MCP configuration to a specific target."""
    setup_logging(verbose)

    try:
        dotfiles_dir = find_dotfiles_directory()
        mcp_data = load_mcp_settings(dotfiles_dir)
        target = get_deployment_target(target_name)

        if target_name == "codex":
            target.deploy(mcp_data)
        else:
            # For Claude and Gemini, deploy the settings file directly
            settings_file = dotfiles_dir / "mcp-settings.json"
            target.deploy(str(settings_file))

    except VibeError as e:
        logger.error(f"✗ {e}")
        raise SystemExit(1) from None
    except Exception as e:
        logger.error(f"✗ Unexpected error: {e}")
        if verbose:
            logger.exception("Full traceback:")
        raise SystemExit(1) from None
