import { Token } from './types';

/**
 * Generator for Markdown format
 * Converts tokens to Markdown syntax
 */
export class MarkdownGenerator {
  /**
   * Generate Markdown from tokens
   */
  static generate(tokens: Token[]): string {
    return tokens.map(token => this.generateToken(token)).join('');
  }

  /**
   * Generate Markdown for a single token
   */
  private static generateToken(token: Token): string {
    switch (token.type) {
      case 'text':
        return token.value;

      case 'blockRef':
        // Page references don't work outside Logseq - convert to bold text
        return `**${token.value}**`;

      case 'markdownLink':
        return this.generateMarkdownLink(token);

      case 'nakedUrl':
        // Naked URLs work in most Markdown renderers - keep as is
        return token.value;

      case 'image':
        return this.generateImage(token);

      case 'videoEmbed':
        return this.generateVideoEmbed(token);

      case 'tag':
        return `**${token.value}**`;

      case 'highlight':
        return `<mark>${token.value}</mark>`;

      case 'bold':
        return `**${token.value}**`;

      case 'codeBlock':
        return this.generateCodeBlock(token);

      case 'query':
        return `Query: ${token.value}`;

      case 'taskMarker':
        return this.generateTaskMarker(token);

      case 'blockquote':
        // Markdown blockquote syntax
        return `> ${token.value}`;

      default:
        return token.value;
    }
  }

  /**
   * Generate Markdown image
   */
  private static generateImage(token: Token): string {
    const altText = token.metadata?.altText || '';
    const imageSrc = token.metadata?.linkTarget || '';
    const isExternal = token.metadata?.isExternalUrl;

    if (isExternal) {
      // External image URL - keep as working image
      return `![${altText}](${imageSrc})`;
    } else {
      // Local asset - convert to text with note (image won't work outside Logseq)
      return `**[Image: ${altText || 'no description'}]** (local file: ${imageSrc})`;
    }
  }

  /**
   * Generate Markdown video embed
   */
  private static generateVideoEmbed(token: Token): string {
    const videoType = token.metadata?.videoType;
    const videoId = token.metadata?.videoId;
    const url = token.metadata?.linkTarget || token.value;

    // Videos don't embed in standard Markdown, but we can provide a clickable link
    if (videoType === 'youtube' && videoId) {
      return `[▶️ YouTube Video](https://www.youtube.com/watch?v=${videoId})`;
    } else if (videoType === 'vimeo' && videoId) {
      return `[▶️ Vimeo Video](https://vimeo.com/${videoId})`;
    } else {
      return `[▶️ Video](${url})`;
    }
  }

  /**
   * Generate Markdown link
   */
  private static generateMarkdownLink(token: Token): string {
    const linkText = token.metadata?.linkText || token.value;
    const linkTarget = token.metadata?.linkTarget || '';
    const isExternal = token.metadata?.isExternalUrl;

    if (isExternal) {
      // External URL - keep as working link
      return `[${linkText}](${linkTarget})`;
    } else {
      // Internal Logseq reference - convert to text with note
      return `**${linkText}** (→ ${linkTarget})`;
    }
  }

  /**
   * Generate Markdown code block
   */
  private static generateCodeBlock(token: Token): string {
    const lang = token.metadata?.language || '';
    return `\`\`\`${lang}\n${token.value}\`\`\``;
  }

  /**
   * Generate Markdown task marker
   */
  private static generateTaskMarker(token: Token): string {
    const taskType = token.metadata?.taskType;
    const markers: Record<string, string> = {
      'TODO': '- [ ] ',
      'DONE': '- [x] ',
      'DOING': '- [ ] 🔄 ',
      'LATER': '- [ ] ⏳ ',
      'NOW': '- [ ] 🔥 ',
    };
    return markers[taskType || 'TODO'] || '- [ ] ';
  }
}

