import { Token } from './types';

/**
 * Generator for HTML format
 * Converts tokens to HTML syntax
 */
export class HtmlGenerator {
  /**
   * Generate HTML from tokens
   */
  static generate(tokens: Token[]): string {
    return tokens.map(token => this.generateToken(token)).join('');
  }

  /**
   * Generate HTML for a single token
   */
  private static generateToken(token: Token): string {
    switch (token.type) {
      case 'text':
        return this.escapeHtml(token.value);

      case 'blockRef':
        // Page references don't work outside Logseq - convert to bold text
        return `<strong>${this.escapeHtml(token.value)}</strong>`;

      case 'markdownLink':
        return this.generateLink(token);

      case 'nakedUrl':
        // Naked URLs - convert to clickable links
        return `<a href="${this.escapeHtml(token.value)}">${this.escapeHtml(token.value)}</a>`;

      case 'image':
        return this.generateImage(token);

      case 'videoEmbed':
        return this.generateVideoEmbed(token);

      case 'tag':
        return `<strong>${this.escapeHtml(token.value)}</strong>`;

      case 'highlight':
        return `<mark>${this.escapeHtml(token.value)}</mark>`;

      case 'bold':
        return `<strong>${this.escapeHtml(token.value)}</strong>`;

      case 'codeBlock':
        return this.generateCodeBlock(token);

      case 'query':
        return `<em>Query: ${this.escapeHtml(token.value)}</em>`;

      case 'taskMarker':
        return this.generateTaskMarker(token);

      case 'blockquote':
        // HTML blockquote element
        return `<blockquote>${this.escapeHtml(token.value)}</blockquote>`;

      default:
        return this.escapeHtml(token.value);
    }
  }

  /**
   * Generate HTML image
   */
  private static generateImage(token: Token): string {
    const altText = token.metadata?.altText || '';
    const imageSrc = token.metadata?.linkTarget || '';
    const isExternal = token.metadata?.isExternalUrl;

    if (isExternal) {
      // External image URL - convert to HTML image tag
      return `<img src="${this.escapeHtml(imageSrc)}" alt="${this.escapeHtml(altText)}" />`;
    } else {
      // Local asset - convert to text with note (image won't work outside Logseq)
      return `<strong>[Image: ${this.escapeHtml(altText || 'no description')}]</strong> <em>(local file: ${this.escapeHtml(imageSrc)})</em>`;
    }
  }

  /**
   * Generate HTML video embed
   */
  private static generateVideoEmbed(token: Token): string {
    const videoType = token.metadata?.videoType;
    const videoId = token.metadata?.videoId;
    const url = token.metadata?.linkTarget || token.value;

    // HTML supports iframe embeds for YouTube and Vimeo
    if (videoType === 'youtube' && videoId) {
      return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${this.escapeHtml(videoId)}" frameborder="0" allowfullscreen></iframe>`;
    } else if (videoType === 'vimeo' && videoId) {
      return `<iframe src="https://player.vimeo.com/video/${this.escapeHtml(videoId)}" width="560" height="315" frameborder="0" allowfullscreen></iframe>`;
    } else {
      // For other videos, provide a link
      return `<a href="${this.escapeHtml(url)}">▶️ Video</a>`;
    }
  }

  /**
   * Generate HTML link
   */
  private static generateLink(token: Token): string {
    const linkText = token.metadata?.linkText || token.value;
    const linkTarget = token.metadata?.linkTarget || '';
    const isExternal = token.metadata?.isExternalUrl;

    if (isExternal) {
      // External URL - convert to HTML link
      return `<a href="${this.escapeHtml(linkTarget)}">${this.escapeHtml(linkText)}</a>`;
    } else {
      // Internal Logseq reference - convert to text with note
      return `<strong>${this.escapeHtml(linkText)}</strong> <em>(→ ${this.escapeHtml(linkTarget)})</em>`;
    }
  }

  /**
   * Generate HTML code block
   */
  private static generateCodeBlock(token: Token): string {
    const lang = token.metadata?.language || '';
    const langClass = lang ? ` class="language-${this.escapeHtml(lang)}"` : '';
    return `<pre><code${langClass}>${this.escapeHtml(token.value)}</code></pre>`;
  }

  /**
   * Generate HTML task marker
   */
  private static generateTaskMarker(token: Token): string {
    const taskType = token.metadata?.taskType;
    const checked = taskType === 'DONE' ? ' checked' : '';
    const emoji = this.getTaskEmoji(taskType);
    return `<input type="checkbox"${checked} disabled /> ${emoji}`;
  }

  /**
   * Get emoji for task type
   */
  private static getTaskEmoji(taskType?: string): string {
    const emojis: Record<string, string> = {
      'DOING': '🔄',
      'LATER': '⏳',
      'NOW': '🔥',
    };
    return emojis[taskType || ''] || '';
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

