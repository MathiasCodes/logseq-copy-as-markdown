import { LogseqBlock } from './types';

export class LogseqAPI {
  /**
   * Get the currently selected block
   */
  static async getCurrentBlock(): Promise<LogseqBlock | null> {
    try {
      const currentBlock = await logseq.Editor.getCurrentBlock();
      if (!currentBlock) {
        return null;
      }
      
      return this.transformBlock(currentBlock);
    } catch (error) {
      console.error('Failed to get current block:', error);
      return null;
    }
  }

  /**
   * Get a block by UUID with its children
   */
  static async getBlockWithChildren(uuid: string, maxDepth: number = 10): Promise<LogseqBlock | null> {
    try {
      const block = await logseq.Editor.getBlock(uuid, {
        includeChildren: true
      });
      
      if (!block) {
        return null;
      }

      return this.transformBlockWithChildren(block, 0, maxDepth);
    } catch (error) {
      console.error('Failed to get block with children:', error);
      return null;
    }
  }

  /**
   * Get the page that contains a block
   */
  static async getBlockPage(uuid: string): Promise<any> {
    try {
      const block = await logseq.Editor.getBlock(uuid);
      if (!block?.page) {
        return null;
      }

      return await logseq.Editor.getPage(block.page.id as any);
    } catch (error) {
      console.error('Failed to get block page:', error);
      return null;
    }
  }

  /**
   * Transform a raw Logseq block to our interface
   */
  private static transformBlock(rawBlock: any): LogseqBlock {
    return {
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

  /**
   * Transform a block with its children recursively
   */
  private static transformBlockWithChildren(
    rawBlock: any, 
    currentDepth: number = 0, 
    maxDepth: number = 10
  ): LogseqBlock {
    const block = this.transformBlock(rawBlock);
    
    if (currentDepth < maxDepth && rawBlock.children && rawBlock.children.length > 0) {
      block.children = rawBlock.children.map((child: any) => 
        this.transformBlockWithChildren(child, currentDepth + 1, maxDepth)
      );
    }

    return block;
  }

  /**
   * Get all blocks on the current page
   */
  static async getCurrentPageBlocks(): Promise<LogseqBlock[]> {
    try {
      const currentPage = await logseq.Editor.getCurrentPage();
      if (!currentPage) {
        return [];
      }

      const pageBlocks = await logseq.Editor.getPageBlocksTree(currentPage.name as any);
      return pageBlocks.map(block => this.transformBlockWithChildren(block));
    } catch (error) {
      console.error('Failed to get current page blocks:', error);
      return [];
    }
  }

  /**
   * Get the parent hierarchy of a block
   */
  static async getBlockHierarchy(uuid: string): Promise<LogseqBlock[]> {
    try {
      const hierarchy: LogseqBlock[] = [];
      let currentBlock = await logseq.Editor.getBlock(uuid);
      
      while (currentBlock) {
        hierarchy.unshift(this.transformBlock(currentBlock));
        
        if (currentBlock.parent?.id) {
          currentBlock = await logseq.Editor.getBlock(currentBlock.parent.id);
        } else {
          break;
        }
      }
      
      return hierarchy;
    } catch (error) {
      console.error('Failed to get block hierarchy:', error);
      return [];
    }
  }
}
