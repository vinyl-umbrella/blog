import { visit } from 'unist-util-visit';

export default function remarkMermaidDetector() {
  return (tree, file) => {
    let hasMermaid = false;

    visit(tree, 'code', (node) => {
      if (node.lang === 'mermaid') {
        hasMermaid = true;
      }
    });

    if (!file.data.astro) {
      file.data.astro = {};
    }

    // add frontmatter
    file.data.astro.frontmatter = {
      ...file.data.astro.frontmatter,
      hasMermaid,
    };
  };
}
