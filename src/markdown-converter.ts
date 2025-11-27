import { LogseqBlock, ExportOptions, ExportResult } from './types';
import { LogseqParser } from './logseq-parser';
import { MarkdownGenerator } from './markdown-generator';

export class MarkdownConverter {
  /**
   * Convert a Logseq block to GitHub-compatible Markdown
   */
  static convertBlock(block: LogseqBlock, options: ExportOptions): ExportResult {
    const lines: string[] = [];
    let blockCount = 0;

    this.processBlock(block, lines, 0, options);
    blockCount = this.countBlocks(block, options);

    return {
      content: lines.join('\n'),
      format: 'markdown',
      blockCount
    };
  }

  /**
   * Process a single block and its children recursively
   */
  private static processBlock(
    block: LogseqBlock, 
    lines: string[], 
    depth: number, 
    options: ExportOptions
  ): void {
    // Skip if we've reached max depth
    if (options.maxDepth && depth > options.maxDepth) {
      return;
    }

    // Convert block content
    const content = this.convertBlockContent(block.content, depth);
    if (content.trim()) {
      lines.push(content);
    }

    // Add properties if requested
    if (options.includeProperties && block.properties && Object.keys(block.properties).length > 0) {
      lines.push(this.convertProperties(block.properties));
    }

    // Process children if requested
    if (options.includeChildren && block.children && block.children.length > 0) {
      for (const child of block.children) {
        this.processBlock(child, lines, depth + 1, options);
      }
    }
  }

  /**
   * Convert Logseq block content to Markdown
   */
  private static convertBlockContent(content: string, depth: number): string {
    if (!content || content.trim() === '') {
      return '';
    }

    let converted = content;

    // Convert Logseq-specific syntax to Markdown
    converted = this.convertLogseqSyntax(converted);

    // Handle multiline content (e.g., headings with properties)
    const lines = converted.split('\n');

    // Add appropriate indentation for nested blocks
    if (depth > 0) {
      const indent = '  '.repeat(depth);

      // Check if content is a code block (starts with ```)
      if (converted.startsWith('```')) {
        // NOTE: Code blocks are indented without bullet points (- )
        // This makes them render as proper code blocks in Markdown.
        // Alternative approach: Keep bullet points for consistency with other nested items.
        // If we want to change this later, add `- ` before the first line and indent
        // subsequent lines with additional spaces.
        converted = lines.map(line => `${indent}${line}`).join('\n');
      } else if (lines.length > 1) {
        // Multiline content: add bullet to first line, indent remaining lines
        // Continuation lines need indent + 2 spaces (to align after "- ")
        // Add backslash at end of lines for hard line breaks (except before blockquotes/empty lines)

        const remainingLines = lines.slice(1).map((line, index) => {
          const isBlockquote = line.trim().startsWith('>');
          const isEmpty = line.trim() === '';
          const isLastLine = index === lines.length - 2; // -2 because we're in slice(1)

          // Check if the NEXT line is a blockquote or empty (to decide if we need backslash on current line)
          const nextLineIndex = index + 2; // +2 because we're in slice(1), so index 0 is lines[1]
          const nextLine = nextLineIndex < lines.length ? lines[nextLineIndex] : null;
          const nextIsBlockquote = nextLine && nextLine.trim().startsWith('>');
          const nextIsEmpty = nextLine && nextLine.trim() === '';

          // Don't add backslash if current line is blockquote/empty, or if it's the last line,
          // or if the next line is a blockquote/empty
          if (isBlockquote || isEmpty || isLastLine || nextIsBlockquote || nextIsEmpty) {
            return `${indent}  ${line}`;
          }

          // Add backslash for hard line break
          return `${indent}  ${line}\\`;
        });

        // Check if we need a backslash on the first line
        const secondLine = lines[1];
        const needsBackslash = secondLine &&
                               !secondLine.trim().startsWith('>') &&
                               secondLine.trim() !== '';

        const firstLine = needsBackslash
          ? `${indent}- ${lines[0]}\\`
          : `${indent}- ${lines[0]}`;

        converted = [firstLine, ...remainingLines].join('\n');
      } else {
        // Single line: add bullet point
        converted = `${indent}- ${converted}`;
      }
    }

    return converted;
  }

  /**
   * Convert Logseq-specific syntax to standard Markdown
   */
  private static convertLogseqSyntax(content: string): string {
    const tokens = LogseqParser.parse(content);
    return MarkdownGenerator.generate(tokens);
  }

  /**
   * Convert block properties to Markdown
   */
  private static convertProperties(properties: Record<string, any>): string {
    const lines: string[] = [];
    
    lines.push('**Properties:**');
    for (const [key, value] of Object.entries(properties)) {
      if (value !== null && value !== undefined) {
        lines.push(`- **${key}**: ${value}`);
      }
    }
    
    return lines.join('\n');
  }

  /**
   * Count total blocks that will be processed
   */
  private static countBlocks(block: LogseqBlock, options: ExportOptions): number {
    let count = 1;
    
    if (options.includeChildren && block.children) {
      for (const child of block.children) {
        count += this.countBlocks(child, options);
      }
    }
    
    return count;
  }
}
