import { Token } from './types';

/**
 * Generator for AsciiDoc format
 * Converts tokens to AsciiDoc syntax
 */
export class AsciiDocGenerator {
  /**
   * Generate AsciiDoc from tokens
   */
  static generate(tokens: Token[]): string {
    return tokens.map(token => this.generateToken(token)).join('');
  }

  /**
   * Generate AsciiDoc for a single token
   */
  private static generateToken(token: Token): string {
    switch (token.type) {
      case 'text':
        // Skip text tokens that are only a single newline (trailing newlines after blockquotes)
        // but keep other whitespace like spaces between words
        if (token.value === '\n') {
          return '';
        }
        return token.value;

      case 'blockRef':
        // Page references don't work outside Logseq - convert to bold text
        return `*${token.value}*`;

      case 'markdownLink':
        return this.generateAsciiDocLink(token);

      case 'nakedUrl':
        // Naked URLs work in AsciiDoc - keep as is
        return token.value;

      case 'image':
        return this.generateImage(token);

      case 'videoEmbed':
        return this.generateVideoEmbed(token);

      case 'tag':
        return `*${token.value}*`;

      case 'highlight':
        return `#${token.value}#`;

      case 'bold':
        return `*${token.value}*`;

      case 'codeBlock':
        return this.generateCodeBlock(token);

      case 'query':
        return `Query: ${token.value}`;

      case 'taskMarker':
        return this.generateTaskMarker(token);

      case 'blockquote':
        return this.generateBlockquote(token);

      default:
        return token.value;
    }
  }

  /**
   * Generate AsciiDoc image
   */
  private static generateImage(token: Token): string {
    const altText = token.metadata?.altText || '';
    const imageSrc = token.metadata?.linkTarget || '';
    const isExternal = token.metadata?.isExternalUrl;

    if (isExternal) {
      // External image URL - convert to AsciiDoc image syntax
      return `image::${imageSrc}[${altText}]`;
    } else {
      // Local asset - convert to text with note (image won't work outside Logseq)
      return `*[Image: ${altText || 'no description'}]* (local file: ${imageSrc})`;
    }
  }

  /**
   * Generate AsciiDoc video embed
   */
  private static generateVideoEmbed(token: Token): string {
    const videoType = token.metadata?.videoType;
    const videoId = token.metadata?.videoId;
    const url = token.metadata?.linkTarget || token.value;

    // AsciiDoc supports video embedding for YouTube and Vimeo
    if (videoType === 'youtube' && videoId) {
      return `video::${videoId}[youtube]`;
    } else if (videoType === 'vimeo' && videoId) {
      return `video::${videoId}[vimeo]`;
    } else {
      // For other videos, provide a link
      return `${url}[▶️ Video]`;
    }
  }

  /**
   * Generate AsciiDoc link
   */
  private static generateAsciiDocLink(token: Token): string {
    const linkText = token.metadata?.linkText || token.value;
    const linkTarget = token.metadata?.linkTarget || '';
    const isExternal = token.metadata?.isExternalUrl;

    if (isExternal) {
      // External URL - convert to AsciiDoc link syntax
      return `${linkTarget}[${linkText}]`;
    } else {
      // Internal Logseq reference - convert to text with note
      return `*${linkText}* (→ ${linkTarget})`;
    }
  }

  /**
   * Generate AsciiDoc code block
   */
  private static generateCodeBlock(token: Token): string {
    const lang = token.metadata?.language || '';
    const sourceAttr = lang ? `[source,${lang}]` : '[source]';
    return `${sourceAttr}\n----\n${token.value.trim()}\n----`;
  }

  /**
   * Generate AsciiDoc task marker
   */
  private static generateTaskMarker(token: Token): string {
    const taskType = token.metadata?.taskType;
    const markers: Record<string, string> = {
      'TODO': '* [ ] ',
      'DONE': '* [x] ',
      'DOING': '* [ ] 🔄 ',
      'LATER': '* [ ] ⏳ ',
      'NOW': '* [ ] 🔥 ',
    };
    return markers[taskType || 'TODO'] || '* [ ] ';
  }

  /**
   * Generate AsciiDoc blockquote
   * Handles quotes with author attribution in AsciiDoc format
   */
  private static generateBlockquote(token: Token): string {
    const content = token.value;

    // Try to extract quote and author attribution
    // Pattern: "Quote text" - Author or just Quote text - Author
    const quoteWithAuthorMatch = content.match(/^"(.+?)"\s*-\s*(.+)$/);

    if (quoteWithAuthorMatch) {
      // Quote with author in format: "Quote" - Author
      const quote = quoteWithAuthorMatch[1];
      const author = quoteWithAuthorMatch[2];
      return `\n"${quote}"\n-- ${author}\n`;
    }

    // Try pattern without quotes around the text
    const simpleQuoteWithAuthorMatch = content.match(/^(.+?)\s*-\s*(.+)$/);

    if (simpleQuoteWithAuthorMatch) {
      // Check if it looks like a quote (not just any text with a dash)
      // We'll be conservative and only treat it as quote+author if it's substantial
      const potentialQuote = simpleQuoteWithAuthorMatch[1].trim();
      const potentialAuthor = simpleQuoteWithAuthorMatch[2].trim();

      // If the "author" part is short (likely a name) and quote is longer, treat as quote+author
      if (potentialAuthor.length < 50 && potentialQuote.length > potentialAuthor.length) {
        return `\n"${potentialQuote}"\n-- ${potentialAuthor}\n`;
      }
    }

    // No author attribution found - just wrap in quotes
    return `"${content}"`;
  }
}

