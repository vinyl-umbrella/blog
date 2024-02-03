import { visit } from 'unist-util-visit';

const linkNewTab = () => {
  return (tree) => {
    visit(tree, 'link', (ele) => {
      try {
        new URL(ele.url);
        // init
        ele.data = ele.data || {};
        ele.data.hProperties = ele.data.hProperties || {};
        // set
        ele.data.hProperties.target = '_blank';
        ele.data.hProperties.rel = 'noopener noreferrer';
      } catch (e) {
        return;
      }
    });
  };
};

export default linkNewTab;
