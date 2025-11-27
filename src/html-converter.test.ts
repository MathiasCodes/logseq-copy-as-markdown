import { describe, it, expect } from 'vitest';
import { HtmlConverter } from './html-converter';
import { LogseqBlock, ExportOptions } from './types';

describe('HtmlConverter', () => {
  const defaultOptions: ExportOptions = {
    format: 'html',
    includeChildren: true,
    includeProperties: false,
    maxDepth: 10,
  };

  describe('Block References', () => {
    it('should convert [[Page]] to <strong>Page</strong>', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'See [[Other Page]] for details',
        children: [],
      };

      const result = HtmlConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('See <strong>Other Page</strong> for details');
    });

    it('should convert multiple block references', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'Check [[Page 1]] and [[Page 2]]',
        children: [],
      };

      const result = HtmlConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('Check <strong>Page 1</strong> and <strong>Page 2</strong>');
    });
  });

  describe('Tags', () => {
    it('should convert #tag to <strong>tag</strong>', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'This is #important',
        children: [],
      };

      const result = HtmlConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('This is <strong>important</strong>');
    });

    it('should convert tags with hyphens and underscores', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'Tags: #project-alpha #task_list',
        children: [],
      };

      const result = HtmlConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('Tags: <strong>project-alpha</strong> <strong>task_list</strong>');
    });
  });

  describe('Task Markers', () => {
    it('should convert TODO to checkbox', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'TODO Complete the task',
        children: [],
      };

      const result = HtmlConverter.convertBlock(block, defaultOptions);
      expect(result.content).toContain('<input type="checkbox"');
      expect(result.content).toContain('disabled');
      expect(result.content).toContain('Complete the task');
    });

    it('should convert DONE to checked checkbox', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'DONE Finished task',
        children: [],
      };

      const result = HtmlConverter.convertBlock(block, defaultOptions);
      expect(result.content).toContain('<input type="checkbox" checked disabled');
      expect(result.content).toContain('Finished task');
    });

    it('should convert DOING to checkbox with emoji', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'DOING Working on it',
        children: [],
      };

      const result = HtmlConverter.convertBlock(block, defaultOptions);
      expect(result.content).toContain('<input type="checkbox"');
      expect(result.content).toContain('🔄');
      expect(result.content).toContain('Working on it');
    });

    it('should convert LATER to checkbox with emoji', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'LATER Future task',
        children: [],
      };

      const result = HtmlConverter.convertBlock(block, defaultOptions);
      expect(result.content).toContain('<input type="checkbox"');
      expect(result.content).toContain('⏳');
      expect(result.content).toContain('Future task');
    });

    it('should convert NOW to checkbox with emoji', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'NOW Urgent task',
        children: [],
      };

      const result = HtmlConverter.convertBlock(block, defaultOptions);
      expect(result.content).toContain('<input type="checkbox"');
      expect(result.content).toContain('🔥');
      expect(result.content).toContain('Urgent task');
    });
  });

  describe('Highlights', () => {
    it('should convert ==highlight== to <mark>highlight</mark>', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'This is ==very important==',
        children: [],
      };

      const result = HtmlConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('This is <mark>very important</mark>');
    });

    it('should convert multiple highlights', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '==First== and ==second== highlight',
        children: [],
      };

      const result = HtmlConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('<mark>First</mark> and <mark>second</mark> highlight');
    });
  });

  describe('Bold Text', () => {
    it('should convert **bold** to <strong>bold</strong>', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'This is **bold text**',
        children: [],
      };

      const result = HtmlConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('This is <strong>bold text</strong>');
    });

    it('should convert multiple bold sections', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '**First** and **second** bold',
        children: [],
      };

      const result = HtmlConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('<strong>First</strong> and <strong>second</strong> bold');
    });
  });

  describe('External Links', () => {
    it('should convert external links to <a> tags', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'Visit [Google](https://google.com)',
        children: [],
      };

      const result = HtmlConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('Visit <a href="https://google.com">Google</a>');
    });

    it('should handle naked URLs', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'Visit https://example.com',
        children: [],
      };

      const result = HtmlConverter.convertBlock(block, defaultOptions);
      expect(result.content).toContain('<a href="https://example.com">https://example.com</a>');
    });
  });

  describe('Images', () => {
    it('should convert external images to <img> tags', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '![Alt text](https://example.com/image.png)',
        children: [],
      };

      const result = HtmlConverter.convertBlock(block, defaultOptions);
      expect(result.content).toContain('<img src="https://example.com/image.png" alt="Alt text"');
    });

    it('should convert local images to text annotation', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '![Local](../assets/image.png)',
        children: [],
      };

      const result = HtmlConverter.convertBlock(block, defaultOptions);
      expect(result.content).toContain('<strong>[Image: Local]</strong>');
      expect(result.content).toContain('local file');
    });
  });

  describe('Video Embeds', () => {
    it('should convert YouTube embeds to iframe', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '{{youtube dQw4w9WgXcQ}}',
        children: [],
      };

      const result = HtmlConverter.convertBlock(block, defaultOptions);
      expect(result.content).toContain('<iframe');
      expect(result.content).toContain('youtube.com/embed/dQw4w9WgXcQ');
    });

    it('should convert Vimeo embeds to iframe', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '{{vimeo 123456789}}',
        children: [],
      };

      const result = HtmlConverter.convertBlock(block, defaultOptions);
      expect(result.content).toContain('<iframe');
      expect(result.content).toContain('player.vimeo.com/video/123456789');
    });
  });

  describe('Code Blocks', () => {
    it('should convert code blocks to <pre><code>', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '```javascript\nconst x = 1;\n```',
        children: [],
      };

      const result = HtmlConverter.convertBlock(block, defaultOptions);
      expect(result.content).toContain('<pre><code class="language-javascript">');
      expect(result.content).toContain('const x = 1;');
      expect(result.content).toContain('</code></pre>');
    });

    it('should handle code blocks without language', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '```\nplain code\n```',
        children: [],
      };

      const result = HtmlConverter.convertBlock(block, defaultOptions);
      expect(result.content).toContain('<pre><code>');
      expect(result.content).toContain('plain code');
    });
  });

  describe('Headings', () => {
    it('should convert # to <h1>', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '# Main Heading',
        children: [],
      };

      const result = HtmlConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('<h1>Main Heading</h1>');
    });

    it('should convert ## to <h2>', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '## Sub Heading',
        children: [],
      };

      const result = HtmlConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('<h2>Sub Heading</h2>');
    });

    it('should convert ### to <h3>', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '### Section',
        children: [],
      };

      const result = HtmlConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('<h3>Section</h3>');
    });
  });

  describe('Hierarchical Blocks', () => {
    it('should convert nested blocks to <ul><li> structure', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'Parent',
        children: [
          {
            uuid: '2',
            content: 'Child 1',
            children: [],
          },
          {
            uuid: '3',
            content: 'Child 2',
            children: [],
          },
        ],
      };

      const result = HtmlConverter.convertBlock(block, defaultOptions);
      expect(result.content).toContain('Parent');
      expect(result.content).toContain('<ul>');
      expect(result.content).toContain('<li>Child 1</li>');
      expect(result.content).toContain('<li>Child 2</li>');
      expect(result.content).toContain('</ul>');
    });

    it('should handle deeply nested blocks', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'Level 1',
        children: [
          {
            uuid: '2',
            content: 'Level 2',
            children: [
              {
                uuid: '3',
                content: 'Level 3',
                children: [],
              },
            ],
          },
        ],
      };

      const result = HtmlConverter.convertBlock(block, defaultOptions);
      expect(result.content).toContain('Level 1');
      expect(result.content).toContain('Level 2');
      expect(result.content).toContain('Level 3');
      // Should have nested <ul> tags
      const ulCount = (result.content.match(/<ul>/g) || []).length;
      expect(ulCount).toBe(2);
    });
  });

  describe('HTML Escaping', () => {
    it('should escape HTML special characters', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'Test <script>alert("xss")</script> & "quotes"',
        children: [],
      };

      const result = HtmlConverter.convertBlock(block, defaultOptions);
      expect(result.content).toContain('&lt;script&gt;');
      expect(result.content).toContain('&amp;');
      expect(result.content).toContain('&quot;');
      expect(result.content).not.toContain('<script>');
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle mixed formatting', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'TODO Review [[Documentation]] with #urgent tag and ==important== notes',
        children: [],
      };

      const result = HtmlConverter.convertBlock(block, defaultOptions);
      expect(result.content).toContain('<input type="checkbox"');
      expect(result.content).toContain('<strong>Documentation</strong>');
      expect(result.content).toContain('<strong>urgent</strong>');
      expect(result.content).toContain('<mark>important</mark>');
    });
  });

  describe('Multiline Content', () => {
    it('should convert newlines to <br> tags', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'Line 1\nLine 2\nLine 3',
        children: [],
      };

      const result = HtmlConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('Line 1<br>Line 2<br>Line 3');
    });

    it('should handle multiline content with formatting', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '**Bold line**\n==Highlighted line==\n#tag line',
        children: [],
      };

      const result = HtmlConverter.convertBlock(block, defaultOptions);
      expect(result.content).toContain('<strong>Bold line</strong>');
      expect(result.content).toContain('<br>');
      expect(result.content).toContain('<mark>Highlighted line</mark>');
      expect(result.content).toContain('<strong>tag</strong>');
    });

    it('should handle heading with additional lines (properties)', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '## Properties Example\nid:: 67460e8e-3f21-4a8e-9876-1234567890ab\ntags:: test, example\ncreated-at:: 2024-11-26',
        children: [],
      };

      const result = HtmlConverter.convertBlock(block, defaultOptions);
      expect(result.content).toContain('<h2>Properties Example</h2>');
      expect(result.content).toContain('<br>');
      expect(result.content).toContain('id:: 67460e8e-3f21-4a8e-9876-1234567890ab');
      expect(result.content).toContain('tags:: test, example');
      expect(result.content).toContain('created-at:: 2024-11-26');

      // Verify the structure: heading directly followed by properties with br between them
      // No <br> between heading and first property (headings are block elements)
      expect(result.content).toMatch(/<h2>Properties Example<\/h2>id::.+<br>tags::.+<br>created-at::/);
    });

    it('should handle heading with children and properties', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '## Section\nproperty:: value',
        children: [
          {
            uuid: '2',
            content: 'Child block',
            children: [],
          },
        ],
      };

      const result = HtmlConverter.convertBlock(block, defaultOptions);
      expect(result.content).toContain('<h2>Section</h2>');
      expect(result.content).toContain('property:: value');
      expect(result.content).toContain('<ul>');
      expect(result.content).toContain('<li>Child block</li>');
    });

    it('should handle code blocks with newlines inside', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '```javascript\nfunction test() {\n  return true;\n}\n```',
        children: [],
      };

      const result = HtmlConverter.convertBlock(block, defaultOptions);
      expect(result.content).toContain('<pre><code class="language-javascript">');
      expect(result.content).toContain('function test()');
      expect(result.content).toContain('<br>');
      expect(result.content).toContain('return true;');
      expect(result.content).toContain('</code></pre>');
    });

    it('should handle query with collapsed property', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '{{query (todo TODO)}}\ncollapsed:: true',
        children: [],
      };

      const result = HtmlConverter.convertBlock(block, defaultOptions);
      expect(result.content).toContain('<em>Query: (todo TODO)</em>');
      expect(result.content).toContain('<br>');
      expect(result.content).toContain('collapsed:: true');
    });
  });

  describe('Blockquotes', () => {
    it('should convert > quote to <blockquote>', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '> This is a quote',
        children: [],
      };

      const result = HtmlConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('<blockquote>This is a quote</blockquote>');
    });

    it('should preserve blockquote content and escape HTML', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '> "The best way to predict the future is to invent it." - Alan Kay',
        children: [],
      };

      const result = HtmlConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('<blockquote>&quot;The best way to predict the future is to invent it.&quot; - Alan Kay</blockquote>');
    });

    it('should handle blockquote with surrounding text', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'Introduction text\n> Quote text\nConclusion',
        children: [],
      };

      const result = HtmlConverter.convertBlock(block, defaultOptions);
      // The blockquote should be converted
      expect(result.content).toContain('<blockquote>Quote text</blockquote>');
      // And the surrounding text should be present
      expect(result.content).toContain('Introduction text');
      expect(result.content).toContain('Conclusion');
    });
  });
});
