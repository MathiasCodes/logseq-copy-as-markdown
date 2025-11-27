import { LogseqBlock, ExportOptions, ExportResult } from './types';
import { LogseqParser } from './logseq-parser';
import { HtmlGenerator } from './html-generator';

export class HtmlConverter {
  /**
   * Convert a Logseq block to HTML format
   */
  static convertBlock(block: LogseqBlock, options: ExportOptions): ExportResult {
    const html = this.generateHtml(block, 0, options);
    const blockCount = this.countBlocks(block, options);

    return {
      content: html,
      format: 'html',
      blockCount
    };
  }

  /**
   * Generate HTML for a block and its children
   */
  private static generateHtml(block: LogseqBlock, depth: number, options: ExportOptions): string {
    // Skip if we've reached max depth
    if (options.maxDepth && depth > options.maxDepth) {
      return '';
    }

    const content = this.convertBlockContent(block.content);
    
    if (depth === 0) {
      // Root block
      let html = '';
      
      if (content.trim()) {
        html += content;
      }
      
      // Add properties if requested
      if (options.includeProperties && block.properties && Object.keys(block.properties).length > 0) {
        html += this.convertProperties(block.properties);
      }
      
      // Process children if requested
      if (options.includeChildren && block.children && block.children.length > 0) {
        html += '<ul>';
        for (const child of block.children) {
          html += this.generateListItem(child, options);
        }
        html += '</ul>';
      }
      
      return html;
    }
    
    return content;
  }

  /**
   * Generate HTML list item for a block
   */
  private static generateListItem(block: LogseqBlock, options: ExportOptions): string {
    const content = this.convertBlockContent(block.content);
    let html = `<li>${content}`;
    
    // Add properties if requested
    if (options.includeProperties && block.properties && Object.keys(block.properties).length > 0) {
      html += this.convertProperties(block.properties);
    }
    
    // Process children if requested
    if (options.includeChildren && block.children && block.children.length > 0) {
      html += '<ul>';
      for (const child of block.children) {
        html += this.generateListItem(child, options);
      }
      html += '</ul>';
    }
    
    html += '</li>';
    return html;
  }

  /**
   * Convert Logseq block content to HTML
   */
  private static convertBlockContent(content: string): string {
    if (!content || content.trim() === '') {
      return '';
    }

    let converted = content;

    // Split content into lines to handle multi-line content
    const lines = converted.split('\n');
    const firstLine = lines[0];

    // Check if the first line is a heading
    if (this.isHeading(firstLine)) {
      const headingHtml = this.convertToHeading(firstLine);

      // If there are additional lines, convert them separately
      if (lines.length > 1) {
        const remainingLines = lines.slice(1).join('\n');
        const convertedRemaining = this.convertLogseqSyntax(remainingLines);
        const withBreaks = convertedRemaining.replace(/\n/g, '<br>');
        // Don't add <br> between heading and content - headings are block elements
        return headingHtml + withBreaks;
      }

      return headingHtml;
    }

    // Convert Logseq-specific syntax to HTML
    converted = this.convertLogseqSyntax(converted);

    // Convert newlines to <br> tags for proper line breaks in HTML
    converted = converted.replace(/\n/g, '<br>');

    return converted;
  }

  /**
   * Check if content is a heading
   */
  private static isHeading(content: string): boolean {
    return /^#{1,6}\s+/.test(content);
  }

  /**
   * Convert heading to HTML
   */
  private static convertToHeading(content: string): string {
    // Only match the first line (no multiline)
    const match = content.match(/^(#{1,6})\s+(.+)/);
    if (!match) return content;

    const level = match[1].length;
    const text = match[2];
    const convertedText = this.convertLogseqSyntax(text);

    return `<h${level}>${convertedText}</h${level}>`;
  }

  /**
   * Convert Logseq-specific syntax to HTML
   */
  private static convertLogseqSyntax(content: string): string {
    const tokens = LogseqParser.parse(content);
    return HtmlGenerator.generate(tokens);
  }

  /**
   * Convert block properties to HTML
   */
  private static convertProperties(properties: Record<string, any>): string {
    let html = '<div class="properties"><strong>Properties:</strong><ul>';
    
    for (const [key, value] of Object.entries(properties)) {
      if (value !== null && value !== undefined) {
        html += `<li><strong>${this.escapeHtml(key)}</strong>: ${this.escapeHtml(String(value))}</li>`;
      }
    }
    
    html += '</ul></div>';
    return html;
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

  /**
   * Escape HTML special characters
   */
  private static escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

