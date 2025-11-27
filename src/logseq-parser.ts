import { Token, TokenType } from './types';

/**
 * Parser for Logseq syntax
 * Converts Logseq content into a list of tokens
 */
export class LogseqParser {
  /**
   * Parse Logseq content into tokens
   *
   * Parsing priority (highest to lowest):
   * 1. Code blocks (can contain other syntax)
   * 2. Queries (can contain block references)
   * 3. Task markers (only at line start)
   * 4. Blockquotes (only at line start)
   * 5. Images (before markdown links - both start with !)
   * 6. Markdown links (before block refs to avoid conflicts)
   * 7. Block references
   * 8. Naked URLs (http://...)
   * 9. Highlights
   * 10. Bold
   * 11. Tags
   * 12. Text (everything else)
   */
  static parse(content: string): Token[] {
    const tokens: Token[] = [];
    let position = 0;

    while (position < content.length) {
      const token =
        this.tryMatchCodeBlock(content, position) ||
        this.tryMatchQuery(content, position) ||
        this.tryMatchTaskMarker(content, position) ||
        this.tryMatchBlockquote(content, position) ||
        this.tryMatchImage(content, position) ||
        this.tryMatchMarkdownLink(content, position) ||
        this.tryMatchBlockRef(content, position) ||
        this.tryMatchNakedUrl(content, position) ||
        this.tryMatchHighlight(content, position) ||
        this.tryMatchBold(content, position) ||
        this.tryMatchTag(content, position) ||
        this.matchText(content, position);

      tokens.push(token);
      position += token.length;
    }

    return tokens;
  }

  /**
   * Try to match a code block: ```language\ncode\n```
   */
  private static tryMatchCodeBlock(content: string, pos: number): Token | null {
    const remaining = content.substring(pos);
    const regex = /^```(\w+)?\n([\s\S]*?)```/;
    const match = remaining.match(regex);

    if (!match) return null;

    return {
      type: 'codeBlock',
      value: match[2],
      metadata: { language: match[1] || '' },
      length: match[0].length,
    };
  }

  /**
   * Try to match a macro: {{query ...}}, {{video ...}}, {{youtube ...}}, {{vimeo ...}}
   */
  private static tryMatchQuery(content: string, pos: number): Token | null {
    const remaining = content.substring(pos);

    // Try to match video embeds first
    const videoEmbed = this.tryMatchVideoEmbed(remaining);
    if (videoEmbed) {
      return videoEmbed;
    }

    // Then try query
    const regex = /^\{\{query\s+([^}]+)\}\}/;
    const match = remaining.match(regex);

    if (!match) return null;

    return {
      type: 'query',
      value: match[1],
      length: match[0].length,
    };
  }

  /**
   * Try to match a video embed: {{video URL}}, {{youtube ID}}, {{vimeo ID}}
   */
  private static tryMatchVideoEmbed(content: string): Token | null {
    // Match {{video URL}}
    const videoRegex = /^\{\{video\s+(https?:\/\/[^}]+)\}\}/;
    const videoMatch = content.match(videoRegex);

    if (videoMatch) {
      const url = videoMatch[1];
      const videoType = this.detectVideoType(url);
      const videoId = this.extractVideoId(url, videoType);

      return {
        type: 'videoEmbed',
        value: url,
        metadata: {
          linkTarget: url,
          videoType,
          videoId
        },
        length: videoMatch[0].length,
      };
    }

    // Match {{youtube VIDEO_ID}}
    const youtubeRegex = /^\{\{youtube\s+([^}]+)\}\}/;
    const youtubeMatch = content.match(youtubeRegex);

    if (youtubeMatch) {
      const videoId = youtubeMatch[1].trim();
      const url = `https://www.youtube.com/watch?v=${videoId}`;

      return {
        type: 'videoEmbed',
        value: url,
        metadata: {
          linkTarget: url,
          videoType: 'youtube',
          videoId
        },
        length: youtubeMatch[0].length,
      };
    }

    // Match {{vimeo VIDEO_ID}}
    const vimeoRegex = /^\{\{vimeo\s+([^}]+)\}\}/;
    const vimeoMatch = content.match(vimeoRegex);

    if (vimeoMatch) {
      const videoId = vimeoMatch[1].trim();
      const url = `https://vimeo.com/${videoId}`;

      return {
        type: 'videoEmbed',
        value: url,
        metadata: {
          linkTarget: url,
          videoType: 'vimeo',
          videoId
        },
        length: vimeoMatch[0].length,
      };
    }

    return null;
  }

  /**
   * Detect video type from URL
   */
  private static detectVideoType(url: string): 'youtube' | 'vimeo' | 'other' {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return 'youtube';
    }
    if (url.includes('vimeo.com')) {
      return 'vimeo';
    }
    return 'other';
  }

  /**
   * Extract video ID from URL
   */
  private static extractVideoId(url: string, type: 'youtube' | 'vimeo' | 'other'): string | undefined {
    if (type === 'youtube') {
      // Match youtube.com/watch?v=VIDEO_ID or youtu.be/VIDEO_ID
      const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/);
      return match ? match[1] : undefined;
    }
    if (type === 'vimeo') {
      // Match vimeo.com/VIDEO_ID
      const match = url.match(/vimeo\.com\/(\d+)/);
      return match ? match[1] : undefined;
    }
    return undefined;
  }

  /**
   * Try to match a task marker at the beginning of the line: TODO, DONE, etc.
   */
  private static tryMatchTaskMarker(content: string, pos: number): Token | null {
    // Only match at start of string or after newline
    if (pos > 0 && content[pos - 1] !== '\n') {
      return null;
    }

    const remaining = content.substring(pos);
    const regex = /^(TODO|DONE|DOING|LATER|NOW)\s+/;
    const match = remaining.match(regex);

    if (!match) return null;

    const taskType = match[1] as 'TODO' | 'DONE' | 'DOING' | 'LATER' | 'NOW';

    return {
      type: 'taskMarker',
      value: '',  // The actual content comes after the marker
      metadata: { taskType },
      length: match[0].length,
    };
  }

  /**
   * Try to match a blockquote: > quote text
   */
  private static tryMatchBlockquote(content: string, pos: number): Token | null {
    // Only match at start of string or after newline
    if (pos > 0 && content[pos - 1] !== '\n') {
      return null;
    }

    const remaining = content.substring(pos);
    const regex = /^> ?(.*)/;  // Match > followed by optional single space
    const match = remaining.match(regex);

    if (!match) return null;

    return {
      type: 'blockquote',
      value: match[1],  // Text without the > and optional space
      length: match[0].length,
    };
  }

  /**
   * Try to match an image: ![alt](src)
   */
  private static tryMatchImage(content: string, pos: number): Token | null {
    const remaining = content.substring(pos);
    // Match ![alt](src) - alt can be empty, src cannot contain )
    const regex = /^!\[([^\]]*)\]\(([^)]+)\)/;
    const match = remaining.match(regex);

    if (!match) return null;

    const altText = match[1];
    const imageSrc = match[2];

    // Check if image source is external URL (contains http:// or https://)
    const isExternalUrl = /^https?:\/\//.test(imageSrc);

    return {
      type: 'image',
      value: altText,
      metadata: {
        altText,
        linkTarget: imageSrc,
        isExternalUrl
      },
      length: match[0].length,
    };
  }

  /**
   * Try to match a Markdown link: [text](url)
   */
  private static tryMatchMarkdownLink(content: string, pos: number): Token | null {
    const remaining = content.substring(pos);
    // Match [text](url) - text can contain spaces, url cannot contain )
    const regex = /^\[([^\]]+)\]\(([^)]+)\)/;
    const match = remaining.match(regex);

    if (!match) return null;

    const linkText = match[1];
    const linkTarget = match[2];

    // Check if URL is external (contains ://)
    const isExternalUrl = /^https?:\/\//.test(linkTarget);

    return {
      type: 'markdownLink',
      value: linkText,
      metadata: {
        linkText,
        linkTarget,
        isExternalUrl
      },
      length: match[0].length,
    };
  }

  /**
   * Try to match a block reference: [[Page]]
   */
  private static tryMatchBlockRef(content: string, pos: number): Token | null {
    const remaining = content.substring(pos);
    const regex = /^\[\[([^\]]+)\]\]/;
    const match = remaining.match(regex);

    if (!match) return null;

    return {
      type: 'blockRef',
      value: match[1],
      metadata: { linkTarget: match[1] },
      length: match[0].length,
    };
  }

  /**
   * Try to match a naked URL: http://... or https://...
   */
  private static tryMatchNakedUrl(content: string, pos: number): Token | null {
    const remaining = content.substring(pos);
    // Match http:// or https:// followed by non-whitespace characters
    // Stop at whitespace, ), ], or end of string
    const regex = /^(https?:\/\/[^\s)\]]+)/;
    const match = remaining.match(regex);

    if (!match) return null;

    return {
      type: 'nakedUrl',
      value: match[1],
      metadata: {
        linkTarget: match[1],
        isExternalUrl: true
      },
      length: match[0].length,
    };
  }

  /**
   * Try to match a highlight: ==text==
   */
  private static tryMatchHighlight(content: string, pos: number): Token | null {
    const remaining = content.substring(pos);
    const regex = /^==([^=]+)==/;
    const match = remaining.match(regex);

    if (!match) return null;

    return {
      type: 'highlight',
      value: match[1],
      length: match[0].length,
    };
  }

  /**
   * Try to match bold text: **text**
   */
  private static tryMatchBold(content: string, pos: number): Token | null {
    const remaining = content.substring(pos);
    const regex = /^\*\*([^*]+)\*\*/;
    const match = remaining.match(regex);

    if (!match) return null;

    return {
      type: 'bold',
      value: match[1],
      length: match[0].length,
    };
  }

  /**
   * Try to match a tag: #tag
   */
  private static tryMatchTag(content: string, pos: number): Token | null {
    const remaining = content.substring(pos);
    const regex = /^#([a-zA-Z0-9_-]+)/;
    const match = remaining.match(regex);

    if (!match) return null;

    return {
      type: 'tag',
      value: match[1],
      length: match[0].length,
    };
  }

  /**
   * Match plain text until the next special character
   */
  private static matchText(content: string, pos: number): Token {
    const remaining = content.substring(pos);

    // Special characters that start tokens
    // Added ! for images
    const specialChars = /[\[#=*`{!]/;

    // Also check for task markers and blockquotes at line start
    const atLineStart = pos === 0 || content[pos - 1] === '\n';
    const taskMarkerAtStart = atLineStart
      ? /^(TODO|DONE|DOING|LATER|NOW)\s+/
      : null;
    const blockquoteAtStart = atLineStart && remaining.startsWith('>');

    if (taskMarkerAtStart && remaining.match(taskMarkerAtStart)) {
      // Don't consume task marker as text
      const nextSpecial = remaining.search(specialChars);
      const length = nextSpecial === -1 ? remaining.length : Math.max(1, nextSpecial);

      return {
        type: 'text',
        value: remaining.substring(0, length),
        length: length,
      };
    }

    // If we're at line start and see a blockquote, stop before it
    if (blockquoteAtStart) {
      return {
        type: 'text',
        value: '',
        length: 0,
      };
    }

    // Find the next special character or URL start
    let nextSpecial = remaining.search(specialChars);
    const urlStart = remaining.search(/https?:\/\//);

    // If we found a URL start and it comes before the next special char (or there is no special char)
    if (urlStart !== -1 && (nextSpecial === -1 || urlStart < nextSpecial)) {
      nextSpecial = urlStart;
    }

    // Also check for newline followed by blockquote
    const newlineBlockquote = remaining.search(/\n>/);
    if (newlineBlockquote !== -1 && (nextSpecial === -1 || newlineBlockquote + 1 < nextSpecial)) {
      // Stop at the newline before the blockquote
      nextSpecial = newlineBlockquote + 1;
    }

    const length = nextSpecial === -1 ? remaining.length : Math.max(1, nextSpecial);

    return {
      type: 'text',
      value: remaining.substring(0, length),
      length: length,
    };
  }
}

