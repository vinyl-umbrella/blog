import { visit } from 'unist-util-visit';

const GITHUB_PERMALINK_ANCHOR_RE = /^#L\d+(?:-L?\d+)?$/;

const isGithubPermalink = (urlString) => {
  try {
    const url = new URL(urlString);
    if (url.hostname !== 'github.com') {
      return false;
    }

    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length < 5 || parts[2] !== 'blob') {
      return false;
    }

    return GITHUB_PERMALINK_ANCHOR_RE.test(url.hash);
  } catch (_error) {
    return false;
  }
};

const remarkGithubPermalinkEmbed = () => {
  return (tree) => {
    visit(tree, 'link', (node) => {
      if (!isGithubPermalink(node.url)) {
        return;
      }

      node.data = node.data || {};
      node.data.hProperties = node.data.hProperties || {};
      node.data.hProperties['data-github-permalink-embed'] = 'true';
    });
  };
};

export default remarkGithubPermalinkEmbed;
