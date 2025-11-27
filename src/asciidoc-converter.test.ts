import { describe, it, expect } from 'vitest';
import { AsciiDocConverter } from './asciidoc-converter';
import { LogseqBlock, ExportOptions } from './types';

describe('AsciiDocConverter', () => {
  const defaultOptions: ExportOptions = {
    format: 'asciidoc',
    includeChildren: true,
    includeProperties: false,
    maxDepth: 10,
  };

  describe('Block References', () => {
    it('should convert [[Page]] to *Page* (non-functional)', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'See [[Other Page]] for details',
        children: [],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('See *Other Page* for details');
    });

    it('should convert multiple block references', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'Check [[Page 1]] and [[Page 2]]',
        children: [],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('Check *Page 1* and *Page 2*');
    });
  });

  describe('Tags', () => {
    it('should convert #tag to *tag*', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'This is #important',
        children: [],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('This is *important*');
    });

    it('should convert tags with hyphens and underscores', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'Tags: #project-alpha #task_list',
        children: [],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('Tags: *project-alpha* *task_list*');
    });
  });

  describe('TODO Markers', () => {
    it('should convert TODO to * [ ]', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'TODO Complete the task',
        children: [],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('* [ ] Complete the task');
    });

    it('should convert DONE to * [x]', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'DONE Finished task',
        children: [],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('* [x] Finished task');
    });

    it('should convert DOING to * [ ] 🔄', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'DOING Working on it',
        children: [],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('* [ ] 🔄 Working on it');
    });

    it('should convert LATER to * [ ] ⏳', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'LATER Future task',
        children: [],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('* [ ] ⏳ Future task');
    });

    it('should convert NOW to * [ ] 🔥', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'NOW Urgent task',
        children: [],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('* [ ] 🔥 Urgent task');
    });

    it('should convert nested TODO without duplicate markers', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'Parent',
        children: [
          {
            uuid: '2',
            content: 'TODO Nested task',
            children: [],
          },
        ],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      const lines = result.content.split('\n');
      expect(lines[0]).toBe('Parent');
      expect(lines[1]).toBe('* [ ] Nested task');
      // Should NOT be '* * [ ] Nested task'
    });

    it('should convert deeply nested tasks with correct markers', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'Root',
        children: [
          {
            uuid: '2',
            content: 'TODO Level 1 task',
            children: [
              {
                uuid: '3',
                content: 'DONE Level 2 task',
                children: [],
              },
            ],
          },
        ],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      const lines = result.content.split('\n');
      expect(lines[0]).toBe('Root');
      expect(lines[1]).toBe('* [ ] Level 1 task');
      expect(lines[2]).toBe('** [x] Level 2 task');
      // Should NOT be '** * [x] Level 2 task'
    });
  });

  describe('Highlights', () => {
    it('should convert ==text== to #text#', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'This is ==important text==',
        children: [],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('This is #important text#');
    });

    it('should convert multiple highlights', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '==First== and ==second== highlight',
        children: [],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('#First# and #second# highlight');
    });
  });

  describe('Formatting Conversion', () => {
    it('should convert **bold** to *bold*', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'This is **bold text**',
        children: [],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('This is *bold text*');
    });
  });

  describe('Code Blocks', () => {
    it('should convert code blocks to AsciiDoc format with language', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '```javascript\nconsole.log("Hello");\n```',
        children: [],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      expect(result.content).toContain('[source,javascript]');
      expect(result.content).toContain('----');
      expect(result.content).toContain('console.log("Hello");');
    });

    it('should handle code blocks without language', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '```\nsome code\n```',
        children: [],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      expect(result.content).toContain('[source]');
      expect(result.content).toContain('----');
      expect(result.content).toContain('some code');
    });

    it('should not indent nested code blocks', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'Code block with language:',
        children: [
          {
            uuid: '2',
            content: '```javascript\nfunction hello() {\n  console.log("Hello World");\n}\n```',
            children: [],
          },
        ],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      const expected = 'Code block with language:\n\n[source,javascript]\n----\nfunction hello() {\n  console.log("Hello World");\n}\n----';
      expect(result.content).toBe(expected);
    });

    it('should not indent nested code blocks without language', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'Code block without language:',
        children: [
          {
            uuid: '2',
            content: '```\nPlain text code\nMultiple lines\n```',
            children: [],
          },
        ],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      const expected = 'Code block without language:\n\n[source]\n----\nPlain text code\nMultiple lines\n----';
      expect(result.content).toBe(expected);
    });
  });

  describe('Queries', () => {
    it('should convert {{query ...}} to Query: ...', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '{{query (todo TODO DOING)}}',
        children: [],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('Query: (todo TODO DOING)');
    });

    it('should convert complex queries', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '{{query (and [[Project]] (task TODO))}}',
        children: [],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      // Query content is preserved as-is (not converted)
      expect(result.content).toBe('Query: (and [[Project]] (task TODO))');
    });

    it('should handle queries with surrounding text', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'Tasks: {{query (todo TODO)}}',
        children: [],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('Tasks: Query: (todo TODO)');
    });
  });

  describe('Hierarchical Structure', () => {
    it('should convert nested blocks with proper AsciiDoc list markers', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'Parent block',
        children: [
          {
            uuid: '2',
            content: 'Child block 1',
            children: [],
          },
          {
            uuid: '3',
            content: 'Child block 2',
            children: [
              {
                uuid: '4',
                content: 'Nested child',
                children: [],
              },
            ],
          },
        ],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      const lines = result.content.split('\n');

      expect(lines[0]).toBe('Parent block');
      expect(lines[1]).toBe('* Child block 1');
      expect(lines[2]).toBe('* Child block 2');
      expect(lines[3]).toBe('** Nested child');
    });

    it('should respect maxDepth option', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'Level 0',
        children: [
          {
            uuid: '2',
            content: 'Level 1',
            children: [
              {
                uuid: '3',
                content: 'Level 2',
                children: [],
              },
            ],
          },
        ],
      };

      const options: ExportOptions = {
        ...defaultOptions,
        maxDepth: 1,
      };

      const result = AsciiDocConverter.convertBlock(block, options);
      expect(result.content).toContain('Level 0');
      expect(result.content).toContain('Level 1');
      expect(result.content).not.toContain('Level 2');
    });

    it('should exclude children when includeChildren is false', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'Parent',
        children: [
          {
            uuid: '2',
            content: 'Child',
            children: [],
          },
        ],
      };

      const options: ExportOptions = {
        ...defaultOptions,
        includeChildren: false,
      };

      const result = AsciiDocConverter.convertBlock(block, options);
      expect(result.content).toBe('Parent');
      expect(result.content).not.toContain('Child');
    });
  });

  describe('Properties', () => {
    it('should include properties when includeProperties is true', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'Block with properties',
        properties: {
          id: 'test-id',
          tags: 'project, important',
        },
        children: [],
      };

      const options: ExportOptions = {
        ...defaultOptions,
        includeProperties: true,
      };

      const result = AsciiDocConverter.convertBlock(block, options);
      expect(result.content).toContain('*Properties:*');
      expect(result.content).toContain('*id*: test-id');
      expect(result.content).toContain('*tags*: project, important');
    });

    it('should exclude properties when includeProperties is false', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'Block with properties',
        properties: {
          id: 'test-id',
        },
        children: [],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      expect(result.content).not.toContain('Properties');
      expect(result.content).not.toContain('test-id');
    });
  });

  describe('Block Count', () => {
    it('should count single block', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'Single block',
        children: [],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      expect(result.blockCount).toBe(1);
    });

    it('should count nested blocks', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'Parent',
        children: [
          { uuid: '2', content: 'Child 1', children: [] },
          { uuid: '3', content: 'Child 2', children: [] },
        ],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      expect(result.blockCount).toBe(3);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle mixed formatting', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'TODO Review [[Documentation]] with #urgent tag and ==important== notes',
        children: [],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      expect(result.content).toContain('* [ ]');
      expect(result.content).toContain('*Documentation*');
      expect(result.content).toContain('*urgent*');
      expect(result.content).toContain('#important#');
    });
  });

  describe('Headings', () => {
    it('should convert # heading to discrete == heading', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '# Main Heading',
        children: [],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      expect(result.content).toContain('[discrete]');
      expect(result.content).toContain('== Main Heading');
    });

    it('should convert ## heading to discrete === heading', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '## Sub Heading',
        children: [],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      expect(result.content).toContain('[discrete]');
      expect(result.content).toContain('=== Sub Heading');
    });

    it('should convert ### heading to discrete ==== heading', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '### Sub Sub Heading',
        children: [],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      expect(result.content).toContain('[discrete]');
      expect(result.content).toContain('==== Sub Sub Heading');
    });

    it('should convert headings at any depth level', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'Root',
        children: [
          {
            uuid: '2',
            content: '## Nested Heading',
            children: [],
          },
        ],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      expect(result.content).toContain('[discrete]');
      expect(result.content).toContain('=== Nested Heading');
      // Should NOT have list markers for headings
      expect(result.content).not.toContain('* [discrete]');
    });

    it('should handle headings mixed with regular list items', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'Root',
        children: [
          {
            uuid: '2',
            content: '## Section One',
            children: [],
          },
          {
            uuid: '3',
            content: 'Regular list item',
            children: [],
          },
          {
            uuid: '4',
            content: '## Section Two',
            children: [],
          },
        ],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      const lines = result.content.split('\n').filter(l => l.trim());

      expect(lines).toContain('[discrete]');
      expect(lines).toContain('=== Section One');
      expect(lines).toContain('* Regular list item');
      expect(lines).toContain('=== Section Two');
    });
  });

  describe('Markdown Links', () => {
    it('should convert external markdown links to AsciiDoc syntax', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'Check out https://www.google.com[Google] for search',
        children: [],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('Check out https://www.google.com[Google] for search');
    });

    it('should convert internal markdown links to text', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'See [this page](Page Name) for details',
        children: [],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('See *this page* (→ Page Name) for details');
    });

    it('should handle multiple markdown links', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '[External](https://example.com) and [Internal](SomePage)',
        children: [],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      expect(result.content).toContain('https://example.com[External]');
      expect(result.content).toContain('*Internal* (→ SomePage)');
    });
  });

  describe('Naked URLs', () => {
    it('should keep naked http URLs', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'Visit http://example.com for more',
        children: [],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('Visit http://example.com for more');
    });

    it('should keep naked https URLs', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'Check https://www.example.com/path',
        children: [],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('Check https://www.example.com/path');
    });

    it('should handle multiple naked URLs', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'See https://example.com and http://test.com',
        children: [],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('See https://example.com and http://test.com');
    });
  });

  describe('Video Embeds', () => {
    it('should convert {{youtube ID}} to AsciiDoc video syntax', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '{{youtube dQw4w9WgXcQ}}',
        children: [],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('video::dQw4w9WgXcQ[youtube]');
    });

    it('should convert {{vimeo ID}} to AsciiDoc video syntax', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '{{vimeo 123456789}}',
        children: [],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('video::123456789[vimeo]');
    });

    it('should convert {{video URL}} with YouTube to AsciiDoc syntax', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '{{video https://www.youtube.com/watch?v=dQw4w9WgXcQ}}',
        children: [],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('video::dQw4w9WgXcQ[youtube]');
    });

    it('should convert {{video URL}} with Vimeo to AsciiDoc syntax', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '{{video https://vimeo.com/123456789}}',
        children: [],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('video::123456789[vimeo]');
    });

    it('should handle video embed in text', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'Watch {{youtube dQw4w9WgXcQ}} for more',
        children: [],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('Watch video::dQw4w9WgXcQ[youtube] for more');
    });
  });

  describe('Images', () => {
    it('should convert external images to AsciiDoc syntax', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '![Logo](https://example.com/logo.png)',
        children: [],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('image::https://example.com/logo.png[Logo]');
    });

    it('should convert local images to text', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '![Diagram](../assets/diagram.png)',
        children: [],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('*[Image: Diagram]* (local file: ../assets/diagram.png)');
    });

    it('should handle image without alt text', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '![](https://example.com/image.jpg)',
        children: [],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('image::https://example.com/image.jpg[]');
    });

    it('should handle local image without alt text', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '![](assets/file.png)',
        children: [],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('*[Image: no description]* (local file: assets/file.png)');
    });

    it('should handle mixed images', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '![External](https://example.com/a.png) and ![Local](../b.png)',
        children: [],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      expect(result.content).toContain('image::https://example.com/a.png[External]');
      expect(result.content).toContain('*[Image: Local]* (local file: ../b.png)');
    });
  });

  describe('Blockquotes', () => {
    it('should convert > quote to quoted text (AsciiDoc does not support Markdown-style blockquotes in lists)', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '> This is a quote',
        children: [],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('"This is a quote"');
    });

    it('should convert blockquote with author attribution to AsciiDoc format', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '> "The best way to predict the future is to invent it." - Alan Kay',
        children: [],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('\n"The best way to predict the future is to invent it."\n-- Alan Kay\n');
    });

    it('should convert blockquote with author attribution (Steve Jobs quote)', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '> "The only way to do great work is to love what you do." - Steve Jobs',
        children: [],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('\n"The only way to do great work is to love what you do."\n-- Steve Jobs\n');
    });

    it('should handle blockquote with surrounding text', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'Introduction text\n> Quote text\nConclusion',
        children: [],
      };

      const result = AsciiDocConverter.convertBlock(block, defaultOptions);
      expect(result.content).toContain('"Quote text"');
    });
  });

  describe('Multiline Content with List Continuation', () => {
    it('should use + at end of line for continuation lines', () => {
      const root: LogseqBlock = {
        uuid: 'root',
        content: 'Root',
        children: [
          {
            uuid: '1',
            content: 'First line\nSecond line\nThird line',
            children: [],
          },
        ],
      };

      const result = AsciiDocConverter.convertBlock(root, defaultOptions);
      const lines = result.content.split('\n');

      expect(lines[0]).toBe('Root');
      expect(lines[1]).toBe('* First line +');
      expect(lines[2]).toBe('Second line +');
      expect(lines[3]).toBe('Third line');
    });

    it('should handle multiline content in nested blocks', () => {
      const root: LogseqBlock = {
        uuid: 'root',
        content: 'Root',
        children: [
          {
            uuid: '1',
            content: 'Parent',
            children: [
              {
                uuid: '2',
                content: 'Child line 1\nChild line 2',
                children: [],
              },
            ],
          },
        ],
      };

      const result = AsciiDocConverter.convertBlock(root, defaultOptions);
      const lines = result.content.split('\n');

      expect(lines[0]).toBe('Root');
      expect(lines[1]).toBe('* Parent');
      expect(lines[2]).toBe('** Child line 1 +');
      expect(lines[3]).toBe('Child line 2');
    });

    it('should handle multiline content with blockquotes', () => {
      const root: LogseqBlock = {
        uuid: 'root',
        content: 'Root',
        children: [
          {
            uuid: '1',
            content: 'Introduction\n> Quote text\nConclusion',
            children: [],
          },
        ],
      };

      const result = AsciiDocConverter.convertBlock(root, defaultOptions);
      const lines = result.content.split('\n');

      expect(lines[0]).toBe('Root');
      expect(lines[1]).toBe('* Introduction +');
      expect(lines[2]).toBe('"Quote text" +');
      expect(lines[3]).toBe('Conclusion');
    });

    it('should handle empty lines in multiline content', () => {
      const root: LogseqBlock = {
        uuid: 'root',
        content: 'Root',
        children: [
          {
            uuid: '1',
            content: 'First line\n\nThird line',
            children: [],
          },
        ],
      };

      const result = AsciiDocConverter.convertBlock(root, defaultOptions);
      const lines = result.content.split('\n');

      expect(lines[0]).toBe('Root');
      expect(lines[1]).toBe('* First line +');
      expect(lines[2]).toBe('+');
      expect(lines[3]).toBe('');
      expect(lines[4]).toBe('Third line');
    });
  });
});
