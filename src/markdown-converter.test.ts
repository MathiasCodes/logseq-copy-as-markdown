import { describe, it, expect } from 'vitest';
import { MarkdownConverter } from './markdown-converter';
import { LogseqBlock, ExportOptions } from './types';

describe('MarkdownConverter', () => {
  const defaultOptions: ExportOptions = {
    format: 'markdown',
    includeChildren: true,
    includeProperties: false,
    maxDepth: 10,
  };

  describe('Block References', () => {
    it('should convert [[Page]] to **Page** (non-functional)', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'See [[Other Page]] for details',
        children: [],
      };

      const result = MarkdownConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('See **Other Page** for details');
    });

    it('should convert multiple block references', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'Check [[Page 1]] and [[Page 2]]',
        children: [],
      };

      const result = MarkdownConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('Check **Page 1** and **Page 2**');
    });
  });

  describe('Tags', () => {
    it('should convert #tag to **tag**', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'This is #important',
        children: [],
      };

      const result = MarkdownConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('This is **important**');
    });

    it('should convert tags with hyphens and underscores', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'Tags: #project-alpha #task_list',
        children: [],
      };

      const result = MarkdownConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('Tags: **project-alpha** **task_list**');
    });
  });

  describe('TODO Markers', () => {
    it('should convert TODO to - [ ]', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'TODO Complete the task',
        children: [],
      };

      const result = MarkdownConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('- [ ] Complete the task');
    });

    it('should convert DONE to - [x]', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'DONE Finished task',
        children: [],
      };

      const result = MarkdownConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('- [x] Finished task');
    });

    it('should convert DOING to - [ ] 🔄', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'DOING Working on it',
        children: [],
      };

      const result = MarkdownConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('- [ ] 🔄 Working on it');
    });

    it('should convert LATER to - [ ] ⏳', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'LATER Future task',
        children: [],
      };

      const result = MarkdownConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('- [ ] ⏳ Future task');
    });

    it('should convert NOW to - [ ] 🔥', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'NOW Urgent task',
        children: [],
      };

      const result = MarkdownConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('- [ ] 🔥 Urgent task');
    });
  });

  describe('Highlights', () => {
    it('should convert ==text== to <mark>text</mark>', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'This is ==important text==',
        children: [],
      };

      const result = MarkdownConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('This is <mark>important text</mark>');
    });

    it('should convert multiple highlights', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '==First== and ==second== highlight',
        children: [],
      };

      const result = MarkdownConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('<mark>First</mark> and <mark>second</mark> highlight');
    });
  });

  describe('Code Blocks', () => {
    it('should preserve code blocks with language', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '```javascript\nconsole.log("Hello");\n```',
        children: [],
      };

      const result = MarkdownConverter.convertBlock(block, defaultOptions);
      expect(result.content).toContain('```javascript');
      expect(result.content).toContain('console.log("Hello");');
    });

    it('should handle code blocks without language', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '```\nsome code\n```',
        children: [],
      };

      const result = MarkdownConverter.convertBlock(block, defaultOptions);
      expect(result.content).toContain('```');
      expect(result.content).toContain('some code');
    });

    it('should preserve indentation in nested code blocks', () => {
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

      const result = MarkdownConverter.convertBlock(block, defaultOptions);
      const expected = 'Code block with language:\n  ```javascript\n  function hello() {\n    console.log("Hello World");\n  }\n  ```';
      expect(result.content).toBe(expected);
    });

    it('should handle nested code blocks without language', () => {
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

      const result = MarkdownConverter.convertBlock(block, defaultOptions);
      const expected = 'Code block without language:\n  ```\n  Plain text code\n  Multiple lines\n  ```';
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

      const result = MarkdownConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('Query: (todo TODO DOING)');
    });

    it('should convert complex queries', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '{{query (and [[Project]] (task TODO))}}',
        children: [],
      };

      const result = MarkdownConverter.convertBlock(block, defaultOptions);
      // Query content is preserved as-is (not converted)
      expect(result.content).toBe('Query: (and [[Project]] (task TODO))');
    });

    it('should handle queries with surrounding text', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'Tasks: {{query (todo TODO)}}',
        children: [],
      };

      const result = MarkdownConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('Tasks: Query: (todo TODO)');
    });
  });

  describe('Hierarchical Structure', () => {
    it('should convert nested blocks with proper indentation', () => {
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

      const result = MarkdownConverter.convertBlock(block, defaultOptions);
      const lines = result.content.split('\n');

      expect(lines[0]).toBe('Parent block');
      expect(lines[1]).toBe('  - Child block 1');
      expect(lines[2]).toBe('  - Child block 2');
      expect(lines[3]).toBe('    - Nested child');
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

      const result = MarkdownConverter.convertBlock(block, options);
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

      const result = MarkdownConverter.convertBlock(block, options);
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

      const result = MarkdownConverter.convertBlock(block, options);
      expect(result.content).toContain('**Properties:**');
      expect(result.content).toContain('**id**: test-id');
      expect(result.content).toContain('**tags**: project, important');
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

      const result = MarkdownConverter.convertBlock(block, defaultOptions);
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

      const result = MarkdownConverter.convertBlock(block, defaultOptions);
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

      const result = MarkdownConverter.convertBlock(block, defaultOptions);
      expect(result.blockCount).toBe(3);
    });
  });

  describe('Markdown Links', () => {
    it('should keep external markdown links functional', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'Check out [Google](https://www.google.com) for search',
        children: [],
      };

      const result = MarkdownConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('Check out [Google](https://www.google.com) for search');
    });

    it('should convert internal markdown links to text', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'See [this page](Page Name) for details',
        children: [],
      };

      const result = MarkdownConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('See **this page** (→ Page Name) for details');
    });

    it('should handle multiple markdown links', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '[External](https://example.com) and [Internal](SomePage)',
        children: [],
      };

      const result = MarkdownConverter.convertBlock(block, defaultOptions);
      expect(result.content).toContain('[External](https://example.com)');
      expect(result.content).toContain('**Internal** (→ SomePage)');
    });
  });

  describe('Naked URLs', () => {
    it('should keep naked http URLs', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'Visit http://example.com for more',
        children: [],
      };

      const result = MarkdownConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('Visit http://example.com for more');
    });

    it('should keep naked https URLs', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'Check https://www.example.com/path',
        children: [],
      };

      const result = MarkdownConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('Check https://www.example.com/path');
    });

    it('should handle multiple naked URLs', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'See https://example.com and http://test.com',
        children: [],
      };

      const result = MarkdownConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('See https://example.com and http://test.com');
    });
  });

  describe('Video Embeds', () => {
    it('should convert {{youtube ID}} to clickable link', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '{{youtube dQw4w9WgXcQ}}',
        children: [],
      };

      const result = MarkdownConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('[▶️ YouTube Video](https://www.youtube.com/watch?v=dQw4w9WgXcQ)');
    });

    it('should convert {{vimeo ID}} to clickable link', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '{{vimeo 123456789}}',
        children: [],
      };

      const result = MarkdownConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('[▶️ Vimeo Video](https://vimeo.com/123456789)');
    });

    it('should convert {{video URL}} to clickable link', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '{{video https://www.youtube.com/watch?v=dQw4w9WgXcQ}}',
        children: [],
      };

      const result = MarkdownConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('[▶️ YouTube Video](https://www.youtube.com/watch?v=dQw4w9WgXcQ)');
    });

    it('should handle video embed in text', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'Watch {{youtube dQw4w9WgXcQ}} for more',
        children: [],
      };

      const result = MarkdownConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('Watch [▶️ YouTube Video](https://www.youtube.com/watch?v=dQw4w9WgXcQ) for more');
    });
  });

  describe('Images', () => {
    it('should keep external images functional', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '![Logo](https://example.com/logo.png)',
        children: [],
      };

      const result = MarkdownConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('![Logo](https://example.com/logo.png)');
    });

    it('should convert local images to text', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '![Diagram](../assets/diagram.png)',
        children: [],
      };

      const result = MarkdownConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('**[Image: Diagram]** (local file: ../assets/diagram.png)');
    });

    it('should handle image without alt text', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '![](https://example.com/image.jpg)',
        children: [],
      };

      const result = MarkdownConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('![](https://example.com/image.jpg)');
    });

    it('should handle local image without alt text', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '![](assets/file.png)',
        children: [],
      };

      const result = MarkdownConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('**[Image: no description]** (local file: assets/file.png)');
    });

    it('should handle mixed images', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '![External](https://example.com/a.png) and ![Local](../b.png)',
        children: [],
      };

      const result = MarkdownConverter.convertBlock(block, defaultOptions);
      expect(result.content).toContain('![External](https://example.com/a.png)');
      expect(result.content).toContain('**[Image: Local]** (local file: ../b.png)');
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle mixed formatting', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'TODO Review [[Documentation]] with #urgent tag and ==important== notes',
        children: [],
      };

      const result = MarkdownConverter.convertBlock(block, defaultOptions);
      expect(result.content).toContain('- [ ]');
      expect(result.content).toContain('**Documentation**');
      expect(result.content).toContain('**urgent**');
      expect(result.content).toContain('<mark>important</mark>');
    });

    it('should handle mixed link types', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'See [[Page]], [External](https://example.com), and https://test.com',
        children: [],
      };

      const result = MarkdownConverter.convertBlock(block, defaultOptions);
      expect(result.content).toContain('**Page**');
      expect(result.content).toContain('[External](https://example.com)');
      expect(result.content).toContain('https://test.com');
    });
  });

  describe('Blockquotes', () => {
    it('should convert > quote to Markdown blockquote', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '> This is a quote',
        children: [],
      };

      const result = MarkdownConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('> This is a quote');
    });

    it('should preserve blockquote formatting', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: '> "The best way to predict the future is to invent it." - Alan Kay',
        children: [],
      };

      const result = MarkdownConverter.convertBlock(block, defaultOptions);
      expect(result.content).toBe('> "The best way to predict the future is to invent it." - Alan Kay');
    });

    it('should handle blockquote with surrounding text', () => {
      const block: LogseqBlock = {
        uuid: '1',
        content: 'Introduction text\n> Quote text\nConclusion',
        children: [],
      };

      const result = MarkdownConverter.convertBlock(block, defaultOptions);
      expect(result.content).toContain('> Quote text');
    });
  });

  describe('Multiline Content', () => {
    it('should indent continuation lines with indent + 2 spaces and add backslashes', () => {
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

      const result = MarkdownConverter.convertBlock(root, defaultOptions);
      const lines = result.content.split('\n');

      expect(lines[0]).toBe('Root');
      expect(lines[1]).toBe('  - First line\\');  // Backslash for hard line break
      expect(lines[2]).toBe('    Second line\\');  // Backslash for hard line break
      expect(lines[3]).toBe('    Third line');  // No backslash on last line
    });

    it('should indent continuation lines correctly for nested blocks', () => {
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

      const result = MarkdownConverter.convertBlock(root, defaultOptions);
      const lines = result.content.split('\n');

      expect(lines[0]).toBe('Root');
      expect(lines[1]).toBe('  - Parent');
      expect(lines[2]).toBe('    - Child line 1\\');  // Backslash for hard line break
      expect(lines[3]).toBe('      Child line 2');  // No backslash on last line
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

      const result = MarkdownConverter.convertBlock(root, defaultOptions);
      const lines = result.content.split('\n');

      expect(lines[0]).toBe('Root');
      expect(lines[1]).toBe('  - Introduction');  // No backslash before blockquote
      expect(lines[2]).toBe('    > Quote text');  // No backslash on blockquote line
      expect(lines[3]).toBe('    Conclusion');  // No backslash on last line
    });
  });
});
