# AGENTS.md — how to work in `docs`

This repository is part of [Horae](https://github.com/horae-dev/horae), built mostly by **AI coding agents** working with a human maintainer. It holds the Horae website and user documentation, published at https://horae-dev.github.io/docs/.

The rules of the core repository apply here: read [horae/AGENTS.md](https://github.com/horae-dev/horae/blob/main/AGENTS.md) (picking issues, when to stop and ask a human, Graft trailers, definition of done).

## Specific to this repository
- Docs must match the code on `main` of horae-dev/horae. Say plainly what is planned and not shipped; Horae is pre-release.
- Examples must be runnable (copy-paste). No real secrets, tokens, personal data or private hostnames.
- The site loads nothing from a third party: fonts are self-hosted in `docs/assets/fonts/`, no analytics.
- `reference/runtime.md`, `reference/schemas.md`, `reference/sdk.md` and `reference/cli.md` are generated from the core repository by `hooks/core.py`: edit them there.
- The look is described in `DESIGN.md` ("The Hours Dial"); product context in `PRODUCT.md`.
- `mkdocs build --strict` must pass.
