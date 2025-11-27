export interface LogseqBlock {
  uuid: string;
  content: string;
  properties?: Record<string, any>;
  children?: LogseqBlock[];
  level?: number;
  parent?: string;
  page?: {
    name: string;
    originalName: string;
  };
}

export interface ExportOptions {
  format: 'markdown' | 'asciidoc' | 'html';
  includeChildren: boolean;
  includeProperties: boolean;
  maxDepth?: number;
}

export interface ExportResult {
  content: string;
  format: 'markdown' | 'asciidoc' | 'html';
  blockCount: number;
}

/**
 * Token types for parsed Logseq content
 */
export type TokenType =
  | 'text'           // Plain text
  | 'blockRef'       // [[Page]] or [[Block Reference]]
  | 'markdownLink'   // [text](url)
  | 'nakedUrl'       // http://... or https://...
  | 'image'          // ![alt](src)
  | 'videoEmbed'     // {{video URL}} or {{youtube ID}} or {{vimeo ID}}
  | 'tag'            // #tag
  | 'highlight'      // ==highlighted text==
  | 'bold'           // **bold text**
  | 'codeBlock'      // ```language\ncode\n```
  | 'query'          // {{query ...}}
  | 'taskMarker'     // TODO, DONE, DOING, LATER, NOW
  | 'blockquote';    // > quote text

/**
 * Metadata for specific token types
 */
export interface TokenMetadata {
  language?: string;                                    // For codeBlock
  taskType?: 'TODO' | 'DONE' | 'DOING' | 'LATER' | 'NOW';  // For taskMarker
  linkTarget?: string;                                  // For blockRef, markdownLink, image, videoEmbed
  linkText?: string;                                    // For markdownLink
  altText?: string;                                     // For image
  videoType?: 'youtube' | 'vimeo' | 'other';            // For videoEmbed
  videoId?: string;                                     // For videoEmbed (YouTube/Vimeo ID)
  isExternalUrl?: boolean;                              // For markdownLink, nakedUrl, image - true if http(s)://
}

/**
 * A parsed token from Logseq content
 */
export interface Token {
  type: TokenType;
  value: string;        // The actual content
  metadata?: TokenMetadata;
  length: number;       // Length in original string (for position tracking)
}
