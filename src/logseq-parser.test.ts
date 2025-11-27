import { describe, it, expect } from 'vitest';
import { LogseqParser } from './logseq-parser';
import { Token } from './types';

describe('LogseqParser', () => {
  describe('Block References', () => {
    it('should parse [[Page]] as blockRef token', () => {
      const tokens = LogseqParser.parse('[[Page]]');
      
      expect(tokens).toHaveLength(1);
      expect(tokens[0]).toEqual({
        type: 'blockRef',
        value: 'Page',
        metadata: { linkTarget: 'Page' },
        length: 8,
      });
    });

    it('should parse text with [[Page]] reference', () => {
      const tokens = LogseqParser.parse('See [[Page]] here');
      
      expect(tokens).toHaveLength(3);
      expect(tokens[0].type).toBe('text');
      expect(tokens[0].value).toBe('See ');
      expect(tokens[1].type).toBe('blockRef');
      expect(tokens[1].value).toBe('Page');
      expect(tokens[2].type).toBe('text');
      expect(tokens[2].value).toBe(' here');
    });

    it('should parse multiple block references', () => {
      const tokens = LogseqParser.parse('[[Page1]] and [[Page2]]');
      
      expect(tokens).toHaveLength(3);
      expect(tokens[0].type).toBe('blockRef');
      expect(tokens[0].value).toBe('Page1');
      expect(tokens[1].type).toBe('text');
      expect(tokens[1].value).toBe(' and ');
      expect(tokens[2].type).toBe('blockRef');
      expect(tokens[2].value).toBe('Page2');
    });
  });

  describe('Tags', () => {
    it('should parse #tag as tag token', () => {
      const tokens = LogseqParser.parse('#tag');
      
      expect(tokens).toHaveLength(1);
      expect(tokens[0]).toEqual({
        type: 'tag',
        value: 'tag',
        length: 4,
      });
    });

    it('should parse tags with hyphens and underscores', () => {
      const tokens = LogseqParser.parse('#project-alpha #task_list');
      
      expect(tokens).toHaveLength(3);
      expect(tokens[0].type).toBe('tag');
      expect(tokens[0].value).toBe('project-alpha');
      expect(tokens[1].type).toBe('text');
      expect(tokens[2].type).toBe('tag');
      expect(tokens[2].value).toBe('task_list');
    });

    it('should parse text with tag', () => {
      const tokens = LogseqParser.parse('This is #important');
      
      expect(tokens).toHaveLength(2);
      expect(tokens[0].type).toBe('text');
      expect(tokens[0].value).toBe('This is ');
      expect(tokens[1].type).toBe('tag');
      expect(tokens[1].value).toBe('important');
    });
  });

  describe('Highlights', () => {
    it('should parse ==text== as highlight token', () => {
      const tokens = LogseqParser.parse('==important==');
      
      expect(tokens).toHaveLength(1);
      expect(tokens[0]).toEqual({
        type: 'highlight',
        value: 'important',
        length: 13,
      });
    });

    it('should parse text with highlight', () => {
      const tokens = LogseqParser.parse('This is ==important text==');
      
      expect(tokens).toHaveLength(2);
      expect(tokens[0].type).toBe('text');
      expect(tokens[0].value).toBe('This is ');
      expect(tokens[1].type).toBe('highlight');
      expect(tokens[1].value).toBe('important text');
    });

    it('should parse multiple highlights', () => {
      const tokens = LogseqParser.parse('==First== and ==second==');
      
      expect(tokens).toHaveLength(3);
      expect(tokens[0].type).toBe('highlight');
      expect(tokens[0].value).toBe('First');
      expect(tokens[1].type).toBe('text');
      expect(tokens[1].value).toBe(' and ');
      expect(tokens[2].type).toBe('highlight');
      expect(tokens[2].value).toBe('second');
    });
  });

  describe('Bold', () => {
    it('should parse **bold** as bold token', () => {
      const tokens = LogseqParser.parse('**bold**');
      
      expect(tokens).toHaveLength(1);
      expect(tokens[0]).toEqual({
        type: 'bold',
        value: 'bold',
        length: 8,
      });
    });

    it('should parse text with bold', () => {
      const tokens = LogseqParser.parse('This is **bold text**');
      
      expect(tokens).toHaveLength(2);
      expect(tokens[0].type).toBe('text');
      expect(tokens[0].value).toBe('This is ');
      expect(tokens[1].type).toBe('bold');
      expect(tokens[1].value).toBe('bold text');
    });
  });

  describe('Task Markers', () => {
    it('should parse TODO at line start', () => {
      const tokens = LogseqParser.parse('TODO Complete task');
      
      expect(tokens).toHaveLength(2);
      expect(tokens[0].type).toBe('taskMarker');
      expect(tokens[0].metadata?.taskType).toBe('TODO');
      expect(tokens[1].type).toBe('text');
      expect(tokens[1].value).toBe('Complete task');
    });

    it('should parse DONE marker', () => {
      const tokens = LogseqParser.parse('DONE Finished');

      expect(tokens[0].type).toBe('taskMarker');
      expect(tokens[0].metadata?.taskType).toBe('DONE');
    });

    it('should parse all task marker types', () => {
      const markers = ['TODO', 'DONE', 'DOING', 'LATER', 'NOW'];

      markers.forEach(marker => {
        const tokens = LogseqParser.parse(`${marker} Task`);
        expect(tokens[0].type).toBe('taskMarker');
        expect(tokens[0].metadata?.taskType).toBe(marker);
      });
    });

    it('should not parse TODO in middle of line', () => {
      const tokens = LogseqParser.parse('This TODO is not a marker');

      expect(tokens.every(t => t.type !== 'taskMarker')).toBe(true);
    });
  });

  describe('Code Blocks', () => {
    it('should parse code block with language', () => {
      const tokens = LogseqParser.parse('```javascript\nconsole.log("test");\n```');

      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('codeBlock');
      expect(tokens[0].value).toBe('console.log("test");\n');
      expect(tokens[0].metadata?.language).toBe('javascript');
    });

    it('should parse code block without language', () => {
      const tokens = LogseqParser.parse('```\nplain code\n```');

      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('codeBlock');
      expect(tokens[0].value).toBe('plain code\n');
      expect(tokens[0].metadata?.language).toBe('');
    });

    it('should not parse syntax inside code blocks', () => {
      const tokens = LogseqParser.parse('```\n[[Page]] #tag ==highlight==\n```');

      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('codeBlock');
      expect(tokens[0].value).toBe('[[Page]] #tag ==highlight==\n');
    });
  });

  describe('Queries', () => {
    it('should parse simple query', () => {
      const tokens = LogseqParser.parse('{{query (todo TODO)}}');

      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('query');
      expect(tokens[0].value).toBe('(todo TODO)');
    });

    it('should parse complex query', () => {
      const tokens = LogseqParser.parse('{{query (and [[Project]] (task TODO))}}');

      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('query');
      expect(tokens[0].value).toBe('(and [[Project]] (task TODO))');
    });

    it('should parse query with surrounding text', () => {
      const tokens = LogseqParser.parse('Tasks: {{query (todo TODO)}}');

      expect(tokens).toHaveLength(2);
      expect(tokens[0].type).toBe('text');
      expect(tokens[0].value).toBe('Tasks: ');
      expect(tokens[1].type).toBe('query');
    });
  });

  describe('Complex Scenarios', () => {
    it('should parse mixed content', () => {
      const tokens = LogseqParser.parse('See [[Page]] with #tag and ==highlight==');

      expect(tokens).toHaveLength(6);
      expect(tokens[0].type).toBe('text');
      expect(tokens[1].type).toBe('blockRef');
      expect(tokens[2].type).toBe('text');
      expect(tokens[3].type).toBe('tag');
      expect(tokens[4].type).toBe('text');
      expect(tokens[5].type).toBe('highlight');
    });

    it('should handle empty string', () => {
      const tokens = LogseqParser.parse('');

      expect(tokens).toHaveLength(0);
    });

    it('should handle plain text only', () => {
      const tokens = LogseqParser.parse('Just plain text');

      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('text');
      expect(tokens[0].value).toBe('Just plain text');
    });

    it('should parse task with mixed formatting', () => {
      const tokens = LogseqParser.parse('TODO Review [[Doc]] with #urgent and ==important==');

      expect(tokens[0].type).toBe('taskMarker');
      expect(tokens[0].metadata?.taskType).toBe('TODO');
      expect(tokens.some(t => t.type === 'blockRef')).toBe(true);
      expect(tokens.some(t => t.type === 'tag')).toBe(true);
      expect(tokens.some(t => t.type === 'highlight')).toBe(true);
    });
  });

  describe('Markdown Links', () => {
    it('should parse external markdown link', () => {
      const tokens = LogseqParser.parse('[Google](https://www.google.com)');

      expect(tokens).toHaveLength(1);
      expect(tokens[0]).toEqual({
        type: 'markdownLink',
        value: 'Google',
        metadata: {
          linkText: 'Google',
          linkTarget: 'https://www.google.com',
          isExternalUrl: true
        },
        length: 32,
      });
    });

    it('should parse internal markdown link', () => {
      const tokens = LogseqParser.parse('[See this](Page Name)');

      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('markdownLink');
      expect(tokens[0].value).toBe('See this');
      expect(tokens[0].metadata?.linkTarget).toBe('Page Name');
      expect(tokens[0].metadata?.isExternalUrl).toBe(false);
    });

    it('should parse markdown link with text', () => {
      const tokens = LogseqParser.parse('Check out [this link](http://example.com) for more');

      expect(tokens).toHaveLength(3);
      expect(tokens[0].type).toBe('text');
      expect(tokens[0].value).toBe('Check out ');
      expect(tokens[1].type).toBe('markdownLink');
      expect(tokens[1].value).toBe('this link');
      expect(tokens[2].type).toBe('text');
      expect(tokens[2].value).toBe(' for more');
    });
  });

  describe('Naked URLs', () => {
    it('should parse naked http URL', () => {
      const tokens = LogseqParser.parse('http://example.com');

      expect(tokens).toHaveLength(1);
      expect(tokens[0]).toEqual({
        type: 'nakedUrl',
        value: 'http://example.com',
        metadata: {
          linkTarget: 'http://example.com',
          isExternalUrl: true
        },
        length: 18,
      });
    });

    it('should parse naked https URL', () => {
      const tokens = LogseqParser.parse('https://www.example.com/path');

      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('nakedUrl');
      expect(tokens[0].value).toBe('https://www.example.com/path');
    });

    it('should parse naked URL in text', () => {
      const tokens = LogseqParser.parse('Visit https://example.com for details');

      expect(tokens).toHaveLength(3);
      expect(tokens[0].type).toBe('text');
      expect(tokens[0].value).toBe('Visit ');
      expect(tokens[1].type).toBe('nakedUrl');
      expect(tokens[1].value).toBe('https://example.com');
      expect(tokens[2].type).toBe('text');
      expect(tokens[2].value).toBe(' for details');
    });

    it('should not parse "http" without ://', () => {
      const tokens = LogseqParser.parse('http is a protocol');

      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('text');
    });
  });

  describe('Video Embeds', () => {
    it('should parse {{video URL}} with YouTube URL', () => {
      const tokens = LogseqParser.parse('{{video https://www.youtube.com/watch?v=dQw4w9WgXcQ}}');

      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('videoEmbed');
      expect(tokens[0].metadata?.videoType).toBe('youtube');
      expect(tokens[0].metadata?.videoId).toBe('dQw4w9WgXcQ');
      expect(tokens[0].metadata?.linkTarget).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    });

    it('should parse {{video URL}} with Vimeo URL', () => {
      const tokens = LogseqParser.parse('{{video https://vimeo.com/123456789}}');

      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('videoEmbed');
      expect(tokens[0].metadata?.videoType).toBe('vimeo');
      expect(tokens[0].metadata?.videoId).toBe('123456789');
    });

    it('should parse {{youtube VIDEO_ID}}', () => {
      const tokens = LogseqParser.parse('{{youtube dQw4w9WgXcQ}}');

      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('videoEmbed');
      expect(tokens[0].metadata?.videoType).toBe('youtube');
      expect(tokens[0].metadata?.videoId).toBe('dQw4w9WgXcQ');
      expect(tokens[0].value).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    });

    it('should parse {{vimeo VIDEO_ID}}', () => {
      const tokens = LogseqParser.parse('{{vimeo 123456789}}');

      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('videoEmbed');
      expect(tokens[0].metadata?.videoType).toBe('vimeo');
      expect(tokens[0].metadata?.videoId).toBe('123456789');
      expect(tokens[0].value).toBe('https://vimeo.com/123456789');
    });

    it('should parse {{video URL}} with youtu.be short URL', () => {
      const tokens = LogseqParser.parse('{{video https://youtu.be/dQw4w9WgXcQ}}');

      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('videoEmbed');
      expect(tokens[0].metadata?.videoType).toBe('youtube');
      expect(tokens[0].metadata?.videoId).toBe('dQw4w9WgXcQ');
    });

    it('should parse video embed in text', () => {
      const tokens = LogseqParser.parse('Watch {{youtube dQw4w9WgXcQ}} here');

      expect(tokens).toHaveLength(3);
      expect(tokens[0].type).toBe('text');
      expect(tokens[0].value).toBe('Watch ');
      expect(tokens[1].type).toBe('videoEmbed');
      expect(tokens[2].type).toBe('text');
      expect(tokens[2].value).toBe(' here');
    });

    it('should still parse {{query ...}} correctly', () => {
      const tokens = LogseqParser.parse('{{query (todo TODO)}}');

      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('query');
      expect(tokens[0].value).toBe('(todo TODO)');
    });
  });

  describe('Images', () => {
    it('should parse external image with alt text', () => {
      const tokens = LogseqParser.parse('![Logo](https://example.com/logo.png)');

      expect(tokens).toHaveLength(1);
      expect(tokens[0]).toEqual({
        type: 'image',
        value: 'Logo',
        metadata: {
          altText: 'Logo',
          linkTarget: 'https://example.com/logo.png',
          isExternalUrl: true
        },
        length: 37,  // Corrected length
      });
    });

    it('should parse external image without alt text', () => {
      const tokens = LogseqParser.parse('![](https://example.com/image.jpg)');

      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('image');
      expect(tokens[0].value).toBe('');
      expect(tokens[0].metadata?.altText).toBe('');
      expect(tokens[0].metadata?.linkTarget).toBe('https://example.com/image.jpg');
      expect(tokens[0].metadata?.isExternalUrl).toBe(true);
    });

    it('should parse local image (asset)', () => {
      const tokens = LogseqParser.parse('![Diagram](../assets/diagram.png)');

      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('image');
      expect(tokens[0].value).toBe('Diagram');
      expect(tokens[0].metadata?.altText).toBe('Diagram');
      expect(tokens[0].metadata?.linkTarget).toBe('../assets/diagram.png');
      expect(tokens[0].metadata?.isExternalUrl).toBe(false);
    });

    it('should parse image in text', () => {
      const tokens = LogseqParser.parse('See ![icon](https://example.com/icon.png) here');

      expect(tokens).toHaveLength(3);
      expect(tokens[0].type).toBe('text');
      expect(tokens[0].value).toBe('See ');
      expect(tokens[1].type).toBe('image');
      expect(tokens[1].value).toBe('icon');
      expect(tokens[2].type).toBe('text');
      expect(tokens[2].value).toBe(' here');
    });

    it('should parse multiple images', () => {
      const tokens = LogseqParser.parse('![A](https://a.com/a.png) and ![B](../b.png)');

      expect(tokens).toHaveLength(3);
      expect(tokens[0].type).toBe('image');
      expect(tokens[0].metadata?.isExternalUrl).toBe(true);
      expect(tokens[1].type).toBe('text');
      expect(tokens[1].value).toBe(' and ');
      expect(tokens[2].type).toBe('image');
      expect(tokens[2].metadata?.isExternalUrl).toBe(false);
    });
  });

  describe('Blockquotes', () => {
    it('should parse > quote as blockquote token', () => {
      const tokens = LogseqParser.parse('> This is a quote');

      expect(tokens).toHaveLength(1);
      expect(tokens[0]).toEqual({
        type: 'blockquote',
        value: 'This is a quote',
        length: 17,
      });
    });

    it('should parse > quote with extra spaces', () => {
      const tokens = LogseqParser.parse('>   Quote with spaces');

      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('blockquote');
      // Only one space after > is removed, rest is preserved
      expect(tokens[0].value).toBe('  Quote with spaces');
    });

    it('should parse blockquote at line start only', () => {
      const tokens = LogseqParser.parse('Text > not a quote');

      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('text');
      expect(tokens[0].value).toBe('Text > not a quote');
    });

    it('should parse blockquote after newline', () => {
      const tokens = LogseqParser.parse('First line\n> Quote line');

      // The parser should recognize blockquote after newline
      expect(tokens.length).toBeGreaterThanOrEqual(2);

      // Find the blockquote token
      const blockquoteToken = tokens.find(t => t.type === 'blockquote');
      expect(blockquoteToken).toBeDefined();
      expect(blockquoteToken?.value).toBe('Quote line');

      // First token should contain the first line
      expect(tokens[0].type).toBe('text');
      expect(tokens[0].value).toContain('First line');
    });

    it('should parse empty blockquote', () => {
      const tokens = LogseqParser.parse('>');

      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('blockquote');
      expect(tokens[0].value).toBe('');
    });

    it('should parse blockquote with special characters', () => {
      const tokens = LogseqParser.parse('> "Quote" with [[ref]] and **bold**');

      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('blockquote');
      expect(tokens[0].value).toBe('"Quote" with [[ref]] and **bold**');
    });
  });
});
