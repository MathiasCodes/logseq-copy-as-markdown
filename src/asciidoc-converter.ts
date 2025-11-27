import { LogseqBlock, ExportOptions, ExportResult } from './types';
import { LogseqParser } from './logseq-parser';
import { AsciiDocGenerator } from './asciidoc-generator';

export class AsciiDocConverter {
  /**
   * Offset used to normalize list depth in AsciiDoc output.
   * This ensures that the first list level after a heading always starts with * (single asterisk),
   * regardless of the actual depth in the block hierarchy.
   * The offset is reset after each heading to maintain proper list normalization.
   */
  private static listDepthOffset: number | null = null;

  /**
   * Convert a Logseq block to AsciiDoc format
   */
  static convertBlock(block: LogseqBlock, options: ExportOptions): ExportResult {
    const lines: string[] = [];
    let blockCount = 0;

    // Reset the list depth offset for each conversion
    this.listDepthOffset = null;

    this.processBlock(block, lines, 0, options);
    blockCount = this.countBlocks(block, options);

    return {
      content: lines.join('\n'),
      format: 'asciidoc',
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
   * Convert Logseq block content to AsciiDoc
   */
  private static convertBlockContent(content: string, depth: number): string {
    if (!content || content.trim() === '') {
      return '';
    }

    let converted = content;

    // Convert Logseq-specific syntax to AsciiDoc
    converted = this.convertLogseqSyntax(converted);

    // Split content into lines to handle multi-line content
    const lines = converted.split('\n');
    const firstLine = lines[0];

    // Check content type and apply appropriate formatting

    // 1. Check if the first line is a heading (starts with # or ##)
    if (this.isHeading(firstLine)) {
      // Reset list depth offset after each heading
      // This ensures that lists under headings start with * (single asterisk)
      this.listDepthOffset = null;
      // Convert to discrete heading (headings work at any depth in AsciiDoc)
      const headingResult = this.convertToDiscreteHeading(firstLine);

      // If there are additional lines (e.g., properties), add them after the heading
      if (lines.length > 1) {
        const remainingLines = lines.slice(1).join('\n');
        return headingResult + remainingLines + '\n';
      }

      return headingResult;
    }

    // 2. Check if it's a code block (starts with [source)
    if (converted.startsWith('[source')) {
      // NOTE: Code blocks are NOT indented in AsciiDoc
      // They need to be at the root level to render correctly as code blocks.
      // Alternative approach: Use list continuation (+) to keep code blocks within list items,
      // but this requires the code block to be on a new line after the list item.
      // For now, we keep code blocks unindented for proper rendering.
      // Add 1 blank line before code block for proper spacing
      return `\n${converted}`;
    }

    // 3. Everything else: use bullet-point hierarchy
    if (depth > 0) {
      // Initialize list depth offset on first non-heading list item
      // This normalizes the output so the first list level always starts with *
      // (excluding headings and code blocks which are handled separately)
      if (this.listDepthOffset === null) {
        this.listDepthOffset = depth - 1;
      }

      // Calculate normalized depth (first list item will be depth 1)
      const normalizedDepth = depth - this.listDepthOffset;

      // Ensure normalized depth is at least 1
      const effectiveDepth = Math.max(1, normalizedDepth);

      // For regular content, use AsciiDoc list markers
      // marker length = level of nesting (AsciiDoc convention)
      const indent = '*'.repeat(effectiveDepth);

      // Handle multiline content with list continuation
      if (lines.length > 1) {
        // Check if content contains a blockquote with author attribution
        // These start with \n and contain -- for author
        const hasQuoteBlock = converted.includes('\n"') && converted.includes('\n--');

        if (hasQuoteBlock) {
          // For quote blocks with author attribution, don't add + markers
          // Remove trailing empty lines that come from the blockquote format
          while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
            lines.pop();
          }

          // Check if first line is empty (quote block starts immediately)
          if (lines[0].trim() === '') {
            // Quote block starts immediately - add marker and rest of content
            converted = `${indent} ` + lines.slice(1).join('\n');
          } else {
            // First line has content before the quote
            const firstLineWithMarker = converted.startsWith('* [')
              ? `${indent}${lines[0].substring(1)}`  // Task marker
              : `${indent} ${lines[0]}`;              // Regular content
            converted = firstLineWithMarker + '\n' + lines.slice(1).join('\n');
          }
        } else {
          // First line: add list marker
          const firstLineWithMarker = converted.startsWith('* [')
            ? `${indent}${lines[0].substring(1)}`  // Task marker
            : `${indent} ${lines[0]}`;              // Regular content

          // Standard multiline handling with + at line ends or on separate lines for empty lines
          const processedLines: string[] = [];

          for (let i = 0; i < lines.length; i++) {
            const line = i === 0 ? firstLineWithMarker : lines[i];
            const isLastLine = i === lines.length - 1;
            const nextLine = i < lines.length - 1 ? lines[i + 1] : null;

            if (isLastLine) {
              // Last line never gets a +
              processedLines.push(line);
            } else if (line.trim() === '') {
              // Empty line: add + on separate line before it
              processedLines.push('+');
              processedLines.push(line);
            } else if (nextLine !== null && nextLine.trim() === '') {
              // Line before empty line: add + at end
              processedLines.push(line + ' +');
            } else {
              // Regular line: add + at end
              processedLines.push(line + ' +');
            }
          }

          converted = processedLines.join('\n');
        }
      } else {
        // Single line: add marker
        if (converted.startsWith('* [')) {
          // Replace the leading '* ' with the depth-appropriate marker
          converted = `${indent}${converted.substring(1)}`;
        } else {
          // Regular content: add marker with space
          converted = `${indent} ${converted}`;
        }
      }
    }

    return converted;
  }

  /**
   * Check if content is a heading (starts with # or ##)
   */
  private static isHeading(content: string): boolean {
    return /^#{1,6}\s/.test(content);
  }

  /**
   * Convert Markdown-style heading to AsciiDoc discrete heading
   */
  private static convertToDiscreteHeading(content: string): string {
    // Only match the first line (no multiline with $)
    const match = content.match(/^(#{1,6})\s+(.+)/);
    if (!match) {
      return content;
    }

    const headingLevel = match[1].length;
    const headingText = match[2];

    // Map Markdown heading levels to AsciiDoc
    // # → == (Level 2, since = is reserved for document title)
    // ## → === (Level 3)
    // ### → ==== (Level 4)
    // etc.
    const adocLevel = '='.repeat(headingLevel + 1);

    // Add 2 blank lines before discrete heading for proper spacing
    return `\n\n[discrete]\n${adocLevel} ${headingText}\n`;
  }

  /**
   * Convert Logseq-specific syntax to AsciiDoc
   */
  private static convertLogseqSyntax(content: string): string {
    const tokens = LogseqParser.parse(content);
    return AsciiDocGenerator.generate(tokens);
  }

  /**
   * Convert block properties to AsciiDoc
   */
  private static convertProperties(properties: Record<string, any>): string {
    const lines: string[] = [];
    
    lines.push('*Properties:*');
    lines.push('');
    for (const [key, value] of Object.entries(properties)) {
      if (value !== null && value !== undefined) {
        lines.push(`* *${key}*: ${value}`);
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
