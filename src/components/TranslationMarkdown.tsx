import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const remarkPlugins = [remarkGfm];

// The parent re-renders on every keystroke in the source box; memoizing keeps the
// markdown from being re-parsed unless the translation itself changed.
const TranslationMarkdown = memo(function TranslationMarkdown({ text }: { text: string }) {
    return <ReactMarkdown remarkPlugins={remarkPlugins}>{text}</ReactMarkdown>;
});

export default TranslationMarkdown;
