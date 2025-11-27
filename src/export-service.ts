import { LogseqAPI } from './logseq-api';
import { MarkdownConverter } from './markdown-converter';
import { AsciiDocConverter } from './asciidoc-converter';
import { HtmlConverter } from './html-converter';
import { LogseqBlock, ExportOptions, ExportResult } from './types';

export class ExportService {
  /**
   * Export the current block
   */
  static async exportCurrentBlock(options: ExportOptions): Promise<ExportResult | null> {
    try {
      const currentBlock = await LogseqAPI.getCurrentBlock();
      if (!currentBlock) {
        throw new Error('No current block found');
      }

      // Get block with children if requested
      let blockToExport = currentBlock;
      if (options.includeChildren) {
        const blockWithChildren = await LogseqAPI.getBlockWithChildren(
          currentBlock.uuid, 
          options.maxDepth || 10
        );
        if (blockWithChildren) {
          blockToExport = blockWithChildren;
        }
      }

      return this.convertBlock(blockToExport, options);
    } catch (error) {
      console.error('Failed to export current block:', error);
      throw error;
    }
  }

  /**
   * Export a specific block by UUID
   */
  static async exportBlock(uuid: string, options: ExportOptions): Promise<ExportResult | null> {
    try {
      let block: LogseqBlock | null;
      
      if (options.includeChildren) {
        block = await LogseqAPI.getBlockWithChildren(uuid, options.maxDepth || 10);
      } else {
        // Get single block without children
        const rawBlock = await logseq.Editor.getBlock(uuid);
        if (!rawBlock) {
          throw new Error(`Block with UUID ${uuid} not found`);
        }
        block = {
          uuid: rawBlock.uuid,
          content: rawBlock.content || '',
          properties: rawBlock.properties || {},
          level: rawBlock.level || 0,
          parent: rawBlock.parent?.id?.toString(),
          page: rawBlock.page ? {
            name: rawBlock.page.name,
            originalName: rawBlock.page.originalName || rawBlock.page.name
          } : undefined
        };
      }

      if (!block) {
        throw new Error(`Block with UUID ${uuid} not found`);
      }

      return this.convertBlock(block, options);
    } catch (error) {
      console.error('Failed to export block:', error);
      throw error;
    }
  }

  /**
   * Export all blocks on the current page
   */
  static async exportCurrentPage(options: ExportOptions): Promise<ExportResult | null> {
    try {
      const pageBlocks = await LogseqAPI.getCurrentPageBlocks();
      if (pageBlocks.length === 0) {
        throw new Error('No blocks found on current page');
      }

      // Combine all page blocks into a single export
      const lines: string[] = [];
      let totalBlockCount = 0;

      for (const block of pageBlocks) {
        const result = this.convertBlock(block, options);
        lines.push(result.content);
        totalBlockCount += result.blockCount;
      }

      return {
        content: lines.join('\n\n'),
        format: options.format,
        blockCount: totalBlockCount
      };
    } catch (error) {
      console.error('Failed to export current page:', error);
      throw error;
    }
  }

  /**
   * Convert a block using the appropriate converter
   */
  private static convertBlock(block: LogseqBlock, options: ExportOptions): ExportResult {
    switch (options.format) {
      case 'markdown':
        return MarkdownConverter.convertBlock(block, options);
      case 'asciidoc':
        return AsciiDocConverter.convertBlock(block, options);
      case 'html':
        return HtmlConverter.convertBlock(block, options);
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }
  }

  /**
   * Get default export options
   */
  static getDefaultOptions(): ExportOptions {
    return {
      format: 'markdown',
      includeChildren: true,
      includeProperties: false,
      maxDepth: 10
    };
  }

  /**
   * Copy result to clipboard
   */
  static async copyToClipboard(result: ExportResult): Promise<void> {
    // Focus the window first - this is critical for clipboard access in Logseq!
    window.focus();

    // For HTML format, use ClipboardItem API to copy both HTML and plain text
    if (result.format === 'html') {
      try {
        if (navigator.clipboard && navigator.clipboard.write) {
          const htmlBlob = new Blob([result.content], { type: 'text/html' });
          const textBlob = new Blob([result.content], { type: 'text/plain' });
          const clipboardItem = new ClipboardItem({
            'text/html': htmlBlob,
            'text/plain': textBlob
          });
          await navigator.clipboard.write([clipboardItem]);
          return;
        }
      } catch (error) {
        // Fall through to execCommand fallback
      }
    }

    // For Markdown/AsciiDoc or HTML fallback, use writeText
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(result.content);
        return;
      }
    } catch (error) {
      // Fall through to execCommand fallback
    }

    // Fallback: use execCommand
    try {
      const textArea = document.createElement('textarea');
      textArea.value = result.content;

      // Make sure the textarea is visible and focusable
      textArea.style.position = 'absolute';
      textArea.style.left = '-9999px';
      textArea.style.top = '0';
      textArea.style.width = '1px';
      textArea.style.height = '1px';
      textArea.style.opacity = '0';
      textArea.setAttribute('readonly', '');

      document.body.appendChild(textArea);

      // Select the text
      textArea.select();
      textArea.setSelectionRange(0, result.content.length);

      // Try to copy
      const successful = document.execCommand('copy');

      // Clean up
      document.body.removeChild(textArea);

      if (successful) {
        return;
      }
    } catch (error) {
      // Fall through to error
    }

    // All methods failed
    throw new Error('Failed to copy to clipboard. Please copy manually.');
  }
}
