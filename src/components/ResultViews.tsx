import { DictionaryResult, FindResult, Register } from '@/lib/types';

const REGISTER_STYLES: Record<Exclude<Register, 'standard'>, string> = {
    formal: 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20',
    informal: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
    slang: 'text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20',
    internet: 'text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20',
    vulgar: 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20',
};

function RegisterTag({ register }: { register: Register }) {
    if (register === 'standard') return null;
    return (
        <span className={`px-1.5 py-px rounded-md border text-[10px] font-semibold uppercase tracking-wide ${REGISTER_STYLES[register]}`}>
            {register}
        </span>
    );
}

function Note({ text }: { text: string }) {
    if (!text) return null;
    return (
        <div className="mt-5 flex gap-2.5 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] px-3 py-2.5 text-sm text-[var(--foreground)]">
            <span aria-hidden="true">💡</span>
            <p className="leading-relaxed">{text}</p>
        </div>
    );
}

export function DictionaryView({ data }: { data: DictionaryResult }) {
    return (
        <div className="animate-fade-in">
            <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1">
                <h2 className="text-2xl font-semibold text-[var(--foreground)] break-words">{data.headword}</h2>
                {data.pronunciation && (
                    <span className="text-sm text-[var(--text-muted)] font-mono">{data.pronunciation}</span>
                )}
            </div>

            <ol className="mt-4 space-y-4">
                {data.senses.map((sense, i) => (
                    <li key={i} className="flex gap-3">
                        <span className="w-7 flex-shrink-0 text-xl leading-7 text-center" aria-hidden="true">
                            {sense.emoji || `${i + 1}.`}
                        </span>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
                                <span className="text-base font-semibold text-[var(--primary)]">{sense.translation}</span>
                                {sense.partOfSpeech && (
                                    <span className="text-xs italic text-[var(--text-muted)]">{sense.partOfSpeech}</span>
                                )}
                                <RegisterTag register={sense.register} />
                            </div>
                            {sense.explanation && (
                                <p className="mt-0.5 text-sm text-[var(--foreground)] leading-relaxed">{sense.explanation}</p>
                            )}
                            {sense.example && (
                                <div className="mt-1.5 pl-3 border-l-2 border-[var(--border)] text-sm leading-relaxed">
                                    <p className="italic text-[var(--foreground)]">{sense.example}</p>
                                    {sense.exampleTranslation && (
                                        <p className="text-[var(--text-muted)]">{sense.exampleTranslation}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </li>
                ))}
            </ol>

            <Note text={data.note} />
        </div>
    );
}

export function FindView({ data }: { data: FindResult }) {
    return (
        <div className="animate-fade-in">
            <ol className="space-y-4">
                {data.candidates.map((c, i) => (
                    <li key={i} className={i === 0 ? '' : 'pt-4 border-t border-[var(--border)]'}>
                        <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
                            <span className={`font-semibold text-[var(--primary)] ${i === 0 ? 'text-xl' : 'text-base'}`}>{c.word}</span>
                            {c.partOfSpeech && <span className="text-xs italic text-[var(--text-muted)]">{c.partOfSpeech}</span>}
                            <RegisterTag register={c.register} />
                        </div>
                        {c.meaning && <p className="mt-0.5 text-sm text-[var(--foreground)]">{c.meaning}</p>}
                        {c.whyItFits && <p className="mt-0.5 text-sm text-[var(--text-muted)]">{c.whyItFits}</p>}
                        {c.example && (
                            <p className="mt-1.5 pl-3 border-l-2 border-[var(--border)] text-sm italic text-[var(--foreground)]">{c.example}</p>
                        )}
                    </li>
                ))}
            </ol>

            <Note text={data.note} />
        </div>
    );
}
