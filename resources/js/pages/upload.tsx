import { Head, useForm } from '@inertiajs/react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import AccountDashboardLayout from '@/layouts/account-dashboard-layout';
import { showGamingAlert } from '@/lib/gaming-alerts';

export default function UploadPage() {
    const form = useForm({
        name: '',
        type: '1',
        orientation: 'land',
        tags: '',
        file: null as File | null,
        thumbnail: null as File | null,
    });
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
    const [showTagSuggestions, setShowTagSuggestions] = useState(false);
    const [useCustomThumbnail, setUseCustomThumbnail] = useState(false);
    const pickingSuggestionRef = useRef(false);

    const activeTagToken = useMemo(() => tagInput.trim(), [tagInput]);

    useEffect(() => {
        form.setData('tags', selectedTags.join(', '));
    }, [form, selectedTags]);

    useEffect(() => {
        const query = activeTagToken.trim().toLowerCase();
        if (!query) {
            setTagSuggestions([]);
            return;
        }

        const timeout = window.setTimeout(async () => {
            try {
                const response = await fetch(
                    `/tag-suggestions?q=${encodeURIComponent(query)}`,
                    {
                        headers: { Accept: 'application/json' },
                        credentials: 'same-origin',
                    },
                );
                const data = await response.json();
                setTagSuggestions(Array.isArray(data) ? data : []);
            } catch (_error) {
                setTagSuggestions([]);
            }
        }, 150);

        return () => window.clearTimeout(timeout);
    }, [activeTagToken]);

    const mergeTagList = (base: string[], incoming: string[]) => {
        const next = [...base];
        incoming.forEach((rawTag) => {
            const normalized = rawTag.trim();
            if (!normalized) {
                return;
            }
            const exists = next.some(
                (item) => item.toLowerCase() === normalized.toLowerCase(),
            );
            if (!exists) {
                next.push(normalized);
            }
        });

        return next;
    };

    const mergeTags = (incoming: string[]) => {
        setSelectedTags((current) => mergeTagList(current, incoming));
    };

    const addTag = (rawTag: string) => {
        const normalized = rawTag.trim();
        if (!normalized) {
            return;
        }

        mergeTags([normalized]);
        setTagInput('');
        setTagSuggestions([]);
        setShowTagSuggestions(false);
    };

    const removeTag = (indexToRemove: number) => {
        setSelectedTags((current) =>
            current.filter((_, index) => index !== indexToRemove),
        );
    };

    const applyTagSuggestion = (suggestedTag: string) => addTag(suggestedTag);

    const handleTagKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault();
            addTag(tagInput.replace(/,+$/, ''));
            return;
        }

        if (event.key === 'Backspace' && tagInput.trim() === '' && selectedTags.length) {
            event.preventDefault();
            setSelectedTags((current) => current.slice(0, -1));
        }
    };

    const submit = () => {
        const pendingTag = tagInput.trim().replace(/,+$/, '');
        const finalTags = pendingTag
            ? mergeTagList(selectedTags, [pendingTag])
            : selectedTags;

        form.transform((data) => ({
            ...data,
            tags: finalTags.join(', '),
        }));
        form.post('/upload', {
            forceFormData: true,
            onSuccess: () =>
                showGamingAlert({
                    type: 'success',
                    title: 'Upload Started',
                    message: 'Wallpaper uploaded. Quality copies are processing in the background.',
                }),
            onError: () =>
                showGamingAlert({
                    type: 'error',
                    title: 'Upload Failed',
                    message: 'Please check fields/files and retry.',
                }),
            onFinish: () => {
                form.transform((data) => data);
            },
        });
    };

    return (
        <>
            <Head title="Upload Wallpaper" />
            <AccountDashboardLayout section="upload">
                <div className="account_shell">
                    <div className="panel panel_form">
                        <h2>Upload Wallpaper</h2>
                        <p className="muted">
                            Upload a wallpaper with details. It will be stored in Laravel storage.
                        </p>

                        <div className="form_grid">
                            <label className="full">
                                <span>Name</span>
                                <input
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                />
                            </label>

                            <label>
                                <span>Type</span>
                                <select
                                    value={form.data.type}
                                    onChange={(e) => form.setData('type', e.target.value)}
                                >
                                    <option value="1">Static</option>
                                    <option value="2">Live Wallpaper</option>
                                </select>
                            </label>

                            <label>
                                <span>Orientation</span>
                                <select
                                    value={form.data.orientation}
                                    onChange={(e) => form.setData('orientation', e.target.value)}
                                >
                                    <option value="land">Landscape</option>
                                    <option value="port">Portrait</option>
                                </select>
                            </label>

                            <label className="full">
                                <span>Tags</span>
                                <div className="tag_input_wrapper">
                                    <div className="tag_capsule_input">
                                        {selectedTags.map((tag, index) => (
                                            <span
                                                key={`${tag.toLowerCase()}-${index}`}
                                                className="tag_capsule"
                                            >
                                                {tag}
                                                <button
                                                    type="button"
                                                    onClick={() => removeTag(index)}
                                                    aria-label={`Remove ${tag}`}
                                                >
                                                    <i className="fa-solid fa-xmark" />
                                                </button>
                                            </span>
                                        ))}
                                        <input
                                            value={tagInput}
                                            onFocus={() => setShowTagSuggestions(true)}
                                            onBlur={() =>
                                                window.setTimeout(
                                                    () => {
                                                        if (!pickingSuggestionRef.current) {
                                                            setShowTagSuggestions(false);
                                                        }
                                                        pickingSuggestionRef.current = false;
                                                    },
                                                    0,
                                                )
                                            }
                                            onKeyDown={handleTagKeyDown}
                                            onChange={(e) => {
                                                setTagInput(e.target.value);
                                                setShowTagSuggestions(true);
                                            }}
                                            onPaste={(event) => {
                                                const pasted = event.clipboardData.getData('text');
                                                if (!/[,;\n]/.test(pasted)) {
                                                    return;
                                                }

                                                event.preventDefault();
                                                const parsed = pasted
                                                    .split(/[,;\n]/)
                                                    .map((item) => item.trim())
                                                    .filter(Boolean);
                                                if (parsed.length) {
                                                    mergeTags(parsed);
                                                }
                                                setTagInput('');
                                                setShowTagSuggestions(false);
                                            }}
                                            placeholder={
                                                selectedTags.length
                                                    ? 'add more...'
                                                    : 'samurai, neon, cyberpunk'
                                            }
                                        />
                                    </div>
                                    {showTagSuggestions &&
                                        activeTagToken.trim().length > 0 &&
                                        tagSuggestions.length > 0 && (
                                            <div className="tag_suggestion_box">
                                                {tagSuggestions.map((item) => (
                                                    <button
                                                        key={item}
                                                        type="button"
                                                        onMouseDown={(event) => {
                                                            pickingSuggestionRef.current = true;
                                                            event.preventDefault();
                                                            applyTagSuggestion(item);
                                                        }}
                                                    >
                                                        {item}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                </div>
                            </label>

                            <label className="full">
                                <span>Main File (required)</span>
                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.webp,.mp4,.mov"
                                    onChange={(e) =>
                                        form.setData('file', e.target.files?.[0] ?? null)
                                    }
                                />
                            </label>

                            <label className="full">
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                    <input
                                        type="checkbox"
                                        checked={useCustomThumbnail}
                                        onChange={(event) => {
                                            const checked = event.target.checked;
                                            setUseCustomThumbnail(checked);
                                            if (!checked) {
                                                form.setData('thumbnail', null);
                                            }
                                        }}
                                    />
                                    Upload custom thumbnail
                                </span>
                                {useCustomThumbnail && (
                                    <input
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.webp"
                                        onChange={(e) =>
                                            form.setData('thumbnail', e.target.files?.[0] ?? null)
                                        }
                                    />
                                )}
                            </label>
                        </div>

                        <div className="form_actions">
                            <button
                                type="button"
                                className="primary_cta"
                                onClick={submit}
                                disabled={form.processing}
                            >
                                {form.processing ? 'Uploading...' : 'Upload'}
                            </button>
                        </div>
                    </div>
                </div>
            </AccountDashboardLayout>
        </>
    );
}
