import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { MarkdownConverter } from './markdown-converter';
import { AsciiDocConverter } from './asciidoc-converter';
import { HtmlConverter } from './html-converter';
import { LogseqBlock, ExportOptions } from './types';

/**
 * Parse Logseq markdown format into a LogseqBlock structure
 * This parser handles the test_logseq.md format with bullet points and indentation
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

    // Check if this is a bullet point line (starts with -)
    const match = line.match(/^(\s*)-\s(.+)$/);

    if (match) {
      // This is a new block
      const indent = match[1].length;
      const depth = indent / 4;
      const blockContent = match[2];

      const newBlock: LogseqBlock = {
        uuid: `block-${i}`,
        content: blockContent,
        children: []
      };

      // Find parent
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
      // This is a continuation line (properties, etc.)
      // Add it to the current block's content
      if (currentBlock) {
        // Calculate the indent of this line
        const lineIndent = line.match(/^(\s*)/)?.[1].length || 0;
        const lineDepth = lineIndent / 4;

        // Only add if it's indented more than the current block (belongs to it)
        if (lineDepth > currentBlockDepth) {
          currentBlock.content += '\n' + line.trim();
        }
      }
    }
  }

  return root;
}

describe('Integration Tests', () => {
  // Read the test file once for all tests
  const testLogseqPath = path.join(__dirname, '../test_logseq.md');
  const testContent = fs.readFileSync(testLogseqPath, 'utf-8');
  const testBlock = parseLogseqMarkdown(testContent);

  const defaultOptions: ExportOptions = {
    format: 'markdown',
    includeChildren: true,
    includeProperties: false,
    maxDepth: 10
  };

  describe('End-to-End Conversion', () => {
    it('should convert test document to Markdown format', () => {
      const options: ExportOptions = { ...defaultOptions, format: 'markdown' };
      const result = MarkdownConverter.convertBlock(testBlock, options);

      expect(result.format).toBe('markdown');
      expect(result.blockCount).toBeGreaterThan(0);
      expect(result.content).toBeTruthy();

      // Snapshot test for full output
      expect(result.content).toMatchSnapshot();
    });

    it('should convert test document to AsciiDoc format', () => {
      const options: ExportOptions = { ...defaultOptions, format: 'asciidoc' };
      const result = AsciiDocConverter.convertBlock(testBlock, options);

      expect(result.format).toBe('asciidoc');
      expect(result.blockCount).toBeGreaterThan(0);
      expect(result.content).toBeTruthy();

      // Snapshot test for full output
      expect(result.content).toMatchSnapshot();
    });

    it('should convert test document to HTML format', () => {
      const options: ExportOptions = { ...defaultOptions, format: 'html' };
      const result = HtmlConverter.convertBlock(testBlock, options);

      expect(result.format).toBe('html');
      expect(result.blockCount).toBeGreaterThan(0);
      expect(result.content).toBeTruthy();
      
      // Snapshot test for full output
      expect(result.content).toMatchSnapshot();
    });
  });

  describe('Format Consistency', () => {
    it('should produce same block count across all formats', () => {
      const markdownResult = MarkdownConverter.convertBlock(testBlock, { ...defaultOptions, format: 'markdown' });
      const asciidocResult = AsciiDocConverter.convertBlock(testBlock, { ...defaultOptions, format: 'asciidoc' });
      const htmlResult = HtmlConverter.convertBlock(testBlock, { ...defaultOptions, format: 'html' });

      expect(markdownResult.blockCount).toBe(asciidocResult.blockCount);
      expect(asciidocResult.blockCount).toBe(htmlResult.blockCount);
    });
  });

  describe('Multiline Content Handling', () => {
    it('should handle headings with properties correctly in all formats', () => {
      // This test specifically checks the multiline content bug we fixed
      const markdownResult = MarkdownConverter.convertBlock(testBlock, { ...defaultOptions, format: 'markdown' });
      const asciidocResult = AsciiDocConverter.convertBlock(testBlock, { ...defaultOptions, format: 'asciidoc' });
      const htmlResult = HtmlConverter.convertBlock(testBlock, { ...defaultOptions, format: 'html' });

      // All formats should contain the Properties Example heading
      expect(markdownResult.content).toContain('## Properties Example');
      expect(asciidocResult.content).toContain('Properties Example');
      expect(htmlResult.content).toContain('Properties Example');

      // All formats should contain the properties
      expect(markdownResult.content).toContain('id:: 67460e8e-3f21-4a8e-9876-1234567890ab');
      expect(asciidocResult.content).toContain('id:: 67460e8e-3f21-4a8e-9876-1234567890ab');
      expect(htmlResult.content).toContain('id:: 67460e8e-3f21-4a8e-9876-1234567890ab');
    });
  });
});

