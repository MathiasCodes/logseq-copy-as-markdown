import * as fs from 'fs';
import * as path from 'path';
import { MarkdownConverter } from './src/markdown-converter';
import { AsciiDocConverter } from './src/asciidoc-converter';
import { HtmlConverter } from './src/html-converter';
import { LogseqBlock, ExportOptions } from './src/types';

/**
 * Parse Logseq markdown format into a LogseqBlock structure
 */
function parseLogseqMarkdown(content: string): LogseqBlock {
  const lines = content.split('\n');
  const root: LogseqBlock = {
    uuid: 'root',
    content: '',
    children: []
  };

  const stack: Array<{ depth: number; block: LogseqBlock }> = [{ depth: -1, block: root }];
  let currentBlock: LogseqBlock | null = null;
  let currentBlockDepth = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const match = line.match(/^(\s*)-\s(.+)$/);

    if (match) {
      const indent = match[1].length;
      const depth = indent / 4;
      const blockContent = match[2];

      const newBlock: LogseqBlock = {
        uuid: `block-${i}`,
        content: blockContent,
        children: []
      };

      while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
        stack.pop();
      }

      const parent = stack[stack.length - 1].block;
      parent.children = parent.children || [];
      parent.children.push(newBlock);

      stack.push({ depth, block: newBlock });
      currentBlock = newBlock;
      currentBlockDepth = depth;
    } else {
      if (currentBlock) {
        const lineIndent = line.match(/^(\s*)/)?.[1].length || 0;
        const lineDepth = lineIndent / 4;

        if (lineDepth > currentBlockDepth) {
          currentBlock.content += '\n' + line.trim();
        }
      }
    }
  }

  return root;
}

// Read test_logseq.md
const testLogseqPath = path.join(__dirname, 'test_logseq.md');
const testContent = fs.readFileSync(testLogseqPath, 'utf-8');
const testBlock = parseLogseqMarkdown(testContent);

const defaultOptions: ExportOptions = {
  format: 'markdown',
  includeChildren: true,
  includeProperties: false,
  maxDepth: 10
};

// Generate Markdown
const markdownResult = MarkdownConverter.convertBlock(testBlock, { ...defaultOptions, format: 'markdown' });
fs.writeFileSync(path.join(__dirname, 'test_document.md'), markdownResult.content, 'utf-8');
console.log('✓ Generated test_document.md');

// Generate AsciiDoc
const asciidocResult = AsciiDocConverter.convertBlock(testBlock, { ...defaultOptions, format: 'asciidoc' });
fs.writeFileSync(path.join(__dirname, 'test_document.adoc'), asciidocResult.content, 'utf-8');
console.log('✓ Generated test_document.adoc');

// Generate HTML
const htmlResult = HtmlConverter.convertBlock(testBlock, { ...defaultOptions, format: 'html' });
fs.writeFileSync(path.join(__dirname, 'test_document.html'), htmlResult.content, 'utf-8');
console.log('✓ Generated test_document.html');

console.log('\nAll test documents generated successfully!');

