# @backant/wizard

CLI wizard that installs the [Backant](https://backant.io) MCP server into your AI coding agents. It auto-detects the clients you have installed and writes the right MCP configuration for each one.

## Usage

Run it with no install:

```bash
npx @backant/wizard
```

Or manage the MCP server explicitly:

```bash
npx @backant/wizard mcp add      # add the Backant MCP server to detected clients
npx @backant/wizard mcp remove   # remove it again
```

### Options

| Flag | Description |
|------|-------------|
| `--remote` | Use remote (cloud) mode |
| `--local` | Use local mode (connects to `localhost:8000`) |
| `--ci` | CI mode — skip interactive prompts |
| `--debug` | Enable debug logging |

See the [Backant docs](https://backant.io/docs) for the API key and full setup.

## Supported clients

Amazon Q, Amp, Antigravity, Augment, Bolt AI, Claude Code, Claude Desktop, Cline, Codex, Continue, Copilot, Crush, Cursor, Factory, Gemini CLI, JetBrains, Kilo Code, Kiro, LM Studio, OpenCode, Perplexity, Qodo Gen, Qwen Coder, Roo Code, Trae, Vibe, Visual Studio, VS Code, Warp, Windsurf, and Zed.

## Development

```bash
npm install
npm run build
node dist/bin.js --help
```

Built with [tsup](https://tsup.egoist.dev/) and [yargs](https://yargs.js.org/); prompts via [@clack/prompts](https://github.com/natemoo-re/clack).
