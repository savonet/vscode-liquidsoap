# vscode-liquidsoap

This repository contains a VSCode extension to support the liquidsoap language. It includes:

- Syntax highlighting
- Formatting

## Syntax highlighting

Syntax highlighting should be working out of the box.

## Formatting

Formatting requires `prettier` and uses the `prettier-liquidsoap-plugin`.

Unfortunately, the prettier ecosystem is pretty tied up with node and `package.json` files. The
fastests way to enable formatting is to go to your project's root and:

1. Install `prettier` and `prettier-plugin-liquidsoap`:

```shell
# feel free to use `yarn` or `pnpm` here
npm install -D prettier prettier-plugin-liquidsoap
```

2. Add the following to `package.json`:

```json
  "prettier": {
    "plugins": [
      "prettier-plugin-liquidsoap"
    ]
  }
```
