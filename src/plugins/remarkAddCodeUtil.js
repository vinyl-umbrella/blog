import { visit } from 'unist-util-visit';

const reCodeblock = () => {
  return (tree) => {
    visit(tree, 'code', (ele, index, parent) => {
      const codeblockMeta = {
        type: 'container',
        data: {
          hName: 'div',
          hProperties: {
            className: ['remark-codeblock'],
          },
        },
        children: [
          {
            type: 'paragraph',
            data: {
              hName: 'div',
              hProperties: {
                className: ['remark-code-title'],
              },
            },
            children: [{ type: 'text', value: ele.meta || '' }],
          },
          {
            type: 'container',
            data: {
              hName: 'button',
              hProperties: {
                className: ['remark-code-copy-button'],
              },
            },
            children: [{ type: 'text', value: 'Copy' }],
          },
        ],
      };

      parent.children.splice(index, 0, codeblockMeta);
      // skip title element
      return index + 2;
    });
  };
};

export default reCodeblock;
