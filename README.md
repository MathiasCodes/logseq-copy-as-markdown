# Copy as Markdown/AsciiDoc/HTML

A Logseq plugin that copies blocks as clean Markdown, AsciiDoc, or HTML format directly to your clipboard.

## Why?

I created this plugin because none of the existing copy or export methods in Logseq delivered the results I needed. This plugin provides a simple, one-click solution to export Logseq blocks in standard formats that work everywhere.

## What it does

Right-click on any block and select "Copy as Markdown", "Copy as AsciiDoc", or "Copy as HTML" - the block and all its children are instantly copied to your clipboard in clean, standard format. No UI, no configuration needed, just instant export.

## Supported Logseq Constructs

The plugin intelligently converts Logseq syntax to standard Markdown, AsciiDoc, and HTML. Links and media are categorized as **functional** (work after pasting) or **non-functional** (converted to text annotations).

| Logseq Syntax | Markdown Output | AsciiDoc Output | HTML Output | Notes |
|---------------|-----------------|-----------------|-------------|-------|
| **Text Formatting** |||||
| `**bold text**` | `**bold text**` | `*bold text*` | `<strong>bold text</strong>` | Standard bold |
| `==highlighted==` | `<mark>highlighted</mark>` | `#highlighted#` | `<mark>highlighted</mark>` | Highlight/mark |
| **Task Markers** |||||
| `TODO Task` | `- [ ] Task` | `[ ] Task` | `<input type="checkbox" disabled /> Task` | Open task |
| `DONE Task` | `- [x] Task` | `[x] Task` | `<input type="checkbox" checked disabled /> Task` | Completed task |
| `DOING Task` | `- [/] Task` | `[ ] 🔄 Task` | `<input type="checkbox" disabled /> 🔄 Task` | In progress (with emoji) |
| `LATER Task` | `- [ ] Task` | `[ ] ⏳ Task` | `<input type="checkbox" disabled /> ⏳ Task` | Deferred (with emoji) |
| `NOW Task` | `- [!] Task` | `[ ] 🔥 Task` | `<input type="checkbox" disabled /> 🔥 Task` | Urgent (with emoji) |
| **Links (Functional)** |||||
| `[Text](https://example.com)` | `[Text](https://example.com)` | `https://example.com[Text]` | `<a href="https://example.com">Text</a>` | ✅ External link works |
| **Links (Non-Functional)** |||||
| `[[Page Reference]]` | `**Page Reference**` | `*Page Reference*` | `<strong>Page Reference</strong>` | ❌ Internal ref → bold |
| **Images** |||||
| `![Alt](https://example.com/img.png)` | `![Alt](https://example.com/img.png)` | `image::https://example.com/img.png[Alt]` | `<img src="https://example.com/img.png" alt="Alt" />` | ✅ External image works |
| `![Alt](../assets/local.png)` | `**[Image: Alt]** (local file: ../assets/local.png)` | `*[Image: Alt]* (local file: ../assets/local.png)` | `<strong>[Image: Alt]</strong> <em>(local file: ../assets/local.png)</em>` | ❌ Local image → text |
| **Video Embeds** |||||
| `{{youtube dQw4w9WgXcQ}}` | `[▶️ YouTube Video](https://www.youtube.com/watch?v=dQw4w9WgXcQ)` | `video::dQw4w9WgXcQ[youtube]` | `<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" ...></iframe>` | ✅ MD: link, AsciiDoc/HTML: embed |
| `{{vimeo 123456789}}` | `[▶️ Vimeo Video](https://vimeo.com/123456789)` | `video::123456789[vimeo]` | `<iframe src="https://player.vimeo.com/video/123456789" ...></iframe>` | ✅ MD: link, AsciiDoc/HTML: embed |
| `{{video https://youtube.com/...}}` | `[▶️ YouTube Video](https://youtube.com/...)` | `video::VIDEO_ID[youtube]` | `<iframe src="https://www.youtube.com/embed/VIDEO_ID" ...></iframe>` | ✅ Auto-detects platform |
| **Code Blocks** |||||
| ` ```javascript`<br>`code`<br>` ``` ` | ` ```javascript`<br>`code`<br>` ``` ` | `[source,javascript]`<br>`----`<br>`code`<br>`----` | `<pre><code class="language-javascript">code</code></pre>` | Syntax highlighting preserved |
| **Other** |||||
| `#tag` | `**tag**` | `*tag*` | `<strong>tag</strong>` | Tags as bold/emphasis |

### Key Principles

- **Functional preservation**: External URLs (http/https) for links, images, and videos remain functional after pasting
- **Non-functional annotation**: Logseq-internal references (pages, local files) are converted to readable text with context
- **Format-specific optimization**: AsciiDoc gets native video embeds, Markdown gets clickable links
- **Hierarchical structure**: Nested blocks preserve indentation and structure

### AsciiDoc Hierarchy Normalization

AsciiDoc does not support headings within bullet-point lists. To maintain a clean structure, the plugin automatically normalizes list depths so that the first list level after each heading always starts with `*` (single asterisk), regardless of the actual depth in the Logseq hierarchy.

**Example:**

Logseq structure:
```
- Project Root
  - ## Features
    - Authentication support
      - OAuth 2.0
      - JWT tokens
    - Database integration
```

AsciiDoc output:
```asciidoc
Project Root

[discrete]
=== Features

* Authentication support
** OAuth 2.0
** JWT tokens
* Database integration
```

Notice how:
- Headings are converted to `[discrete]` sections (non-numbered headings)
- The first list level under each heading starts with `*` (not `**`)
- Nested items correctly use `**`, `***`, etc.
- The hierarchy is "flattened" (normalized) for better readability

## Installation

### From Logseq Marketplace (pending)

1. Open Logseq
2. Go to `Settings` → `Advanced` → Enable `Plugin system`
3. Open `Plugins` (Shortcut: `Esc t p`)
4. Go to the `Marketplace` tab
5. Search for "Copy as Markdown"
6. Click `Install`

### Manual Installation

1. Download the latest release from [Releases](https://github.com/your-repo/logseq-copy-as-markdown/releases)
2. Extract the ZIP file
3. Open Logseq → `Settings` → `Advanced` → Enable `Developer mode` and `Plugin system`
4. Go to `Plugins` (Shortcut: `Esc t p`) → `Load unpacked plugin`
5. Select the extracted folder

## Usage

1. Right-click on a block's bullet point
2. Select "📄 Copy as Markdown", "📝 Copy as AsciiDoc", or "🌐 Copy as HTML"
3. Paste anywhere

## Example

**Logseq input:**
```
- Project Planning
  - TODO Collect requirements
  - DONE Create mockups
  - See [[Design Doc]] for details
  - Important: ==review by Friday==
```

**Markdown output:**
```markdown
- Project Planning
  - - [ ] Collect requirements
  - - [x] Create mockups
  - See **Design Doc** for details
  - Important: <mark>review by Friday</mark>
```

**AsciiDoc output:**
```asciidoc
* Project Planning
** [ ] Collect requirements
** [x] Create mockups
** See *Design Doc* for details
** Important: #review by Friday#
```

**HTML output:**
```html
Project Planning<ul><li><input type="checkbox" disabled /> Collect requirements</li><li><input type="checkbox" checked disabled /> Create mockups</li><li>See <strong>Design Doc</strong> for details</li><li>Important: <mark>review by Friday</mark></li></ul>
```

## Development

### Architecture

The plugin uses a clean parser/generator architecture:

1. **Parser** (`logseq-parser.ts`): Parses Logseq syntax into tokens (one implementation for all formats)
2. **Generators** (`markdown-generator.ts`, `asciidoc-generator.ts`, `html-generator.ts`): Convert tokens to target format
3. **Converters** (`markdown-converter.ts`, `asciidoc-converter.ts`, `html-converter.ts`): Orchestrate the conversion process

This design eliminates code duplication and makes it easy to add new export formats.

### Testing

```bash
pnpm install
pnpm test              # Run tests in watch mode
pnpm test:unit         # Run unit tests only (fast)
pnpm test:integration  # Run integration tests with snapshots
pnpm test:all          # Run all tests (unit + integration)
pnpm test:run          # Alias for test:all
pnpm test:ui           # Run tests with UI
```

The plugin has comprehensive test coverage:
- **170 unit tests** covering all features and edge cases for each converter
- **5 integration tests** with snapshot testing for end-to-end validation
- **Total: 175 tests** ensuring reliability across all formats

## License

MIT
