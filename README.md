# vscode-liquidsoap

Visual Studio Code support for the [Liquidsoap](https://www.liquidsoap.info) language:

- Syntax highlighting
- Errors and warnings as you type, from Liquidsoap's own typechecker
- Documentation and types on hover, completion, signature help, go to definition and an outline of your script
- Formatting with [liquidsoap-prettier](https://github.com/savonet/liquidsoap-prettier)

Everything but the highlighting comes from the [Liquidsoap language server](https://github.com/savonet/liquidsoap-language-server), which the extension starts for you. Nothing else needs to be installed.

Where `liquidsoap` is on your `PATH`, the server asks it for its standard library, so the operators it knows are the ones you have, LV2 and LADSPA plugins included. Otherwise it uses the standard library it ships with.

In the web version of Visual Studio Code, only highlighting and formatting are available: the language server needs Node.

## Settings

- `liquidsoap.languageServer.enabled`: check scripts with the language server. When off, only formatting is available.
- `liquidsoap.path`: the `liquidsoap` to take the standard library from.

## Building

The extension bundles the language server, which is fetched from its repository:

```sh
pnpm install
pnpm fetch:server   # downloads the server, set LIQUIDSOAP_LANGUAGE_SERVER to use another build
pnpm build
pnpm package        # writes the .vsix
```

`pnpm test` checks the syntax highlighting against the snapshots in `tests/`, and `pnpm typecheck` the extension's sources.
