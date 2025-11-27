- Root
    - # Feature Test Document
    - This document demonstrates all features supported by the Logseq Copy as Markdown/AsciiDoc plugin.
    - ## Block References and Links
        - This is a reference to [[Another Page]]
        - Multiple references: [[Page One]] and [[Page Two]]
        - Nested reference: See [[Documentation/Setup Guide]]
    - ## Tags
        - This block has a #important tag
        - Multiple tags: #urgent #review #documentation
        - Tags with special characters: #my-tag #under_score
    - ## Task Markers
        - TODO This is a todo item
        - DONE This task is completed
        - DOING Currently working on this
        - LATER This is for later
        - NOW High priority task
    - ## Highlights
        - This is ==very important text== that should be highlighted!
        - Multiple highlights: ==First highlight== and ==second highlight== in one line
        - Combined with other formatting: ==Important== #urgent task
    - ## Bold Text
        - This is **bold text** for emphasis
        - **Multiple** **bold** **words**
        - Combined: **Bold** and ==highlighted== text
    - ## Code Blocks
        - Inline code example `run command`.
        - Code block with language:
            - ```javascript
              function hello() {
                console.log("Hello World");
              }
              ```
        - Code block without language:
            - ```
              Plain text code
              Multiple lines
              ```
    - ## Queries
        - Simple query example:
            - {{query (todo TODO DOING)}}
              collapsed:: true
        - Advanced query:
            - {{query (and [[Project]] (task TODO))}}
    - ## Nested Blocks
        - Parent block with #parent tag
            - First child block
                - Nested child with [[Reference]]
                    - Deep nesting level 3
                        - Even deeper level 4
            - Second child with ==highlight==
                - TODO Task in nested structure
    - ## Complex Combinations
        - TODO Review [[Documentation]] with #urgent tag and ==important== notes
        - DONE Completed task with **bold text** and [[Page Reference]]
        - This combines ==highlighting==, **bold**, #tags, and [[links]] all together
    - ## Properties Example
      id:: 67460e8e-3f21-4a8e-9876-1234567890ab
      tags:: test, example, features
      created-at:: 2024-11-26
        - This block has properties attached
    - ## Edge Cases
        - Empty nested block:
            -
        - Block with only a tag:
            - #standalone
        - Block with only a link:
            - [[OnlyLink]]
        - Block with only highlight:
            - ==OnlyHighlight==
    - ## Real World Example
        - TODO Implement new feature for [[User Authentication]]
            - DOING Research authentication methods #security
                - Review [[OAuth 2.0]] documentation
                - Check ==best practices== for token storage
            - LATER Write unit tests
                - ```typescript
                  describe('Authentication', () => {
                    it('should validate tokens', () => {
                      // test code
                    });
                  });
                  ```
            - TODO Update [[API Documentation]]
        - DONE Initial setup completed **successfully**
    - ## Multiline Text
        - This is a block with multiple lines of text.
          Each line continues the same block.
          This tests how multiline content is handled.
          The converter should preserve all lines properly.
    - ## Quotes
        - This block contains a quote: 
          > "The best way to predict the future is to invent it." - Alan Kay
        - Block with quote and text before and after: Some introduction text 
          > "Innovation distinguishes between a leader and a follower." - Steve Jobs
          
          and some conclusion.
        - > "The only way to do great work is to love what you do." - Steve Jobs