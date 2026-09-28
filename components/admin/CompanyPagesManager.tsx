import React, { useCallback, useEffect, useState } from 'react';
import type { CompanyPageContent, EmployerProfile } from '../../types';
import {
    getAllEmployers,
    getCompanyPage,
    saveCompanyPage,
    updateEmployerBasics,
    isCompanySlugTaken,
    createCompanyAccount,
    uploadFile,
} from '../../services/db';
import { useToast } from '../../contexts/ToastContext';
import Spinner from '../Spinner';

const PAGE_SIZE = 25;
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const toSlug = (name: string) =>
    name
        .toLowerCase()
        .replace(/\b(pte|ltd|private|limited|sdn|bhd|inc|llc|co)\b\.?/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

const publicPath = (userId: string, slug?: string) => (slug ? `/company/${slug}` : `/employer/profile/${userId}`);

const inputClass = 'mt-1 block w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-sm focus:outline-none focus:border-cyan-500 bg-white';
const labelClass = 'block text-xs font-mono font-bold uppercase text-slate-700';

const Field: React.FC<{
    label: string;
    value: string | number | undefined;
    onChange: (value: string) => void;
    type?: 'text' | 'textarea' | 'number' | 'email' | 'url';
    placeholder?: string;
    hint?: string;
    wide?: boolean;
}> = ({ label, value, onChange, type = 'text', placeholder, hint, wide }) => (
    <label className={wide ? 'md:col-span-2 block' : 'block'}>
        <span className={labelClass}>{label}</span>
        {type === 'textarea' ? (
            <textarea value={value ?? ''} onChange={e => onChange(e.target.value)} rows={4} placeholder={placeholder} className={inputClass} />
        ) : (
            <input type={type} value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={inputClass} />
        )}
        {hint && <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>}
    </label>
);

const Panel: React.FC<{ title: string; description?: string; children: React.ReactNode }> = ({ title, description, children }) => (
    <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-base font-extrabold text-slate-900">{title}</h3>
        {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
        <div className="mt-5">{children}</div>
    </section>
);

type FieldDef<T> = { key: keyof T & string; label: string; type?: 'text' | 'textarea' | 'number' | 'image'; wide?: boolean };

/** Add / edit / reorder / remove rows of a repeatable section (stats,
 * capabilities, talents...). `image` fields take a URL or an upload. */
function ListEditor<T extends Record<string, any>>({
    items,
    onChange,
    fields,
    emptyItem,
    itemLabel,
    onUpload,
}: {
    items: T[];
    onChange: (items: T[]) => void;
    fields: FieldDef<T>[];
    emptyItem: T;
    itemLabel: string;
    onUpload?: (file: File) => Promise<string>;
}) {
    const [uploadingKey, setUploadingKey] = useState<string | null>(null);
    const update = (index: number, key: keyof T, value: any) =>
        onChange(items.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
    const move = (index: number, delta: number) => {
        const target = index + delta;
        if (target < 0 || target >= items.length) return;
        const next = [...items];
        [next[index], next[target]] = [next[target], next[index]];
        onChange(next);
    };

    return (
        <div className="space-y-4">
            {items.length === 0 && <p className="text-xs italic text-slate-400">None yet — this section is hidden on the public page until you add one.</p>}
            {items.map((item, index) => (
                <div key={index} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                    <div className="mb-3 flex items-center justify-between font-mono text-[11px] font-bold uppercase text-slate-500">
                        <span>{itemLabel} {index + 1}</span>
                        <span className="space-x-3">
                            <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="hover:text-slate-900 disabled:opacity-30">↑</button>
                            <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1} className="hover:text-slate-900 disabled:opacity-30">↓</button>
                            <button type="button" onClick={() => onChange(items.filter((_, i) => i !== index))} className="text-red-600 hover:text-red-700">Remove</button>
                        </span>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {fields.map(field => {
                            const value = item[field.key];
                            if (field.type === 'image') {
                                const uploadKey = `${index}-${field.key}`;
                                return (
                                    <div key={field.key} className={field.wide ? 'md:col-span-2' : ''}>
                                        <span className={labelClass}>{field.label}</span>
                                        <div className="mt-1 flex items-center gap-3">
                                            {value && <img src={value} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover object-top border border-slate-200 bg-white" />}
                                            <input type="url" value={value ?? ''} onChange={e => update(index, field.key, e.target.value)} placeholder="https://… or upload" className={inputClass.replace('mt-1 ', '')} />
                                            {onUpload && (
                                                <label className="shrink-0 cursor-pointer rounded-full bg-cyan-50 px-3 py-2 font-mono text-[11px] font-bold text-cyan-700 hover:bg-cyan-100">
                                                    {uploadingKey === uploadKey ? '…' : 'Upload'}
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        disabled={uploadingKey !== null}
                                                        onChange={async e => {
                                                            const file = e.target.files?.[0];
                                                            e.target.value = '';
                                                            if (!file) return;
                                                            setUploadingKey(uploadKey);
                                                            try {
                                                                update(index, field.key, await onUpload(file));
                                                            } finally {
                                                                setUploadingKey(null);
                                                            }
                                                        }}
                                                    />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                );
                            }
                            return (
                                <Field
                                    key={field.key}
                                    label={field.label}
                                    type={field.type === 'number' ? 'number' : field.type === 'textarea' ? 'textarea' : 'text'}
                                    value={value}
                                    wide={field.wide}
                                    onChange={v => update(index, field.key, field.type === 'number' ? Number(v) : v)}
                                />
                            );
                        })}
                    </div>
                </div>
            ))}
            <button type="button" onClick={() => onChange([...items, { ...emptyItem }])} className="rounded-full border border-dashed border-cyan-400 px-4 py-2 font-mono text-xs font-bold text-cyan-700 hover:bg-cyan-50">
                + Add {itemLabel.toLowerCase()}
            </button>
        </div>
    );
}

type Stat = NonNullable<CompanyPageContent['stats']>[number];
type Capability = NonNullable<CompanyPageContent['capabilities']>[number];
type Sector = NonNullable<CompanyPageContent['sectors']>[number];
type Project = NonNullable<CompanyPageContent['projects']>[number];
type Talent = NonNullable<CompanyPageContent['talents']>[number];

const CompanyPageEditor: React.FC<{ employer: EmployerProfile; onClose: () => void; onSaved: () => void }> = ({ employer, onClose, onSaved }) => {
    const { showToast } = useToast();
    const [basics, setBasics] = useState<EmployerProfile>(employer);
    const [page, setPage] = useState<CompanyPageContent>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [logoUploading, setLogoUploading] = useState(false);

    useEffect(() => {
        let cancelled = false;
        getCompanyPage(employer.user_id).then(content => {
            if (!cancelled) {
                setPage(content ?? {});
                setLoading(false);
            }
        });
        return () => { cancelled = true; };
    }, [employer.user_id]);

    const setBasic = (key: keyof EmployerProfile) => (value: string) => setBasics(prev => ({ ...prev, [key]: value }));
    const setPageField = <K extends keyof CompanyPageContent>(key: K) => (value: CompanyPageContent[K]) => setPage(prev => ({ ...prev, [key]: value }));

    // Admin uploads go under the employer's own storage folder (the bucket's
    // policy lets admins write any folder).
    const uploadImage = (file: File) => uploadFile('employer-logos', employer.user_id, file);

    const handleSave = async () => {
        const slug = page.slug?.trim() || undefined;
        if (!basics.company_name?.trim()) {
            showToast('Company name is required.', 'error');
            return;
        }
        if (slug && !SLUG_REGEX.test(slug)) {
            showToast('Page URL may only use lowercase letters, numbers and single hyphens.', 'error');
            return;
        }
        setSaving(true);
        try {
            if (slug && (await isCompanySlugTaken(slug, employer.user_id))) {
                showToast(`"/company/${slug}" is already used by another company.`, 'error');
                return;
            }
            await updateEmployerBasics(employer.user_id, {
                company_name: basics.company_name.trim(),
                industry: basics.industry,
                website_url: basics.website_url,
                phone: basics.phone,
                company_size: basics.company_size,
                year_founded: basics.year_founded ? Number(basics.year_founded) : undefined,
                description: basics.description,
                company_logo_url: basics.company_logo_url,
            });
            await saveCompanyPage(employer.user_id, { ...page, slug });
            showToast('Company page saved.', 'success');
            onSaved();
        } catch (err) {
            console.error('Company page save failed:', err);
            showToast(err instanceof Error ? err.message : 'Failed to save the company page.', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="py-16"><Spinner /></div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-900">Edit company page — {employer.company_name}</h2>
                    <a href={publicPath(employer.user_id, page.slug)} target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-cyan-700 hover:underline">
                        {window.location.origin}{publicPath(employer.user_id, page.slug)} ↗
                    </a>
                </div>
                <div className="flex gap-2 font-mono text-xs">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold">Back to list</button>
                    <button type="button" onClick={handleSave} disabled={saving || logoUploading} className="px-6 py-2.5 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold shadow-md disabled:opacity-50">
                        {saving ? 'Saving…' : 'Save page'}
                    </button>
                </div>
            </div>

            <Panel title="1. Introduction & contact" description="Company facts, short introduction, contact details and social links.">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field label="Company name" value={basics.company_name} onChange={setBasic('company_name')} />
                    <label className="block">
                        <span className={labelClass}>Public page URL</span>
                        <div className="mt-1 flex items-center gap-2">
                            <span className="font-mono text-xs text-slate-400">/company/</span>
                            <input value={page.slug ?? ''} onChange={e => setPageField('slug')(e.target.value.toLowerCase())} placeholder="e.g. regional-energy" className={inputClass.replace('mt-1 ', '')} />
                            <button type="button" onClick={() => setPageField('slug')(toSlug(basics.company_name || ''))} className="shrink-0 font-mono text-[11px] font-bold text-cyan-700 hover:underline">From name</button>
                        </div>
                        <span className="mt-1 block text-[11px] text-slate-400">Optional. Without one the page is still reachable at /employer/profile/…</span>
                    </label>
                    <Field label="Tagline (section headline)" value={page.tagline} onChange={setPageField('tagline')} placeholder="International expertise. Singapore execution." wide />
                    <Field label="Short introduction" type="textarea" value={basics.description} onChange={setBasic('description')} wide />
                    <Field label="Industry" value={basics.industry} onChange={setBasic('industry')} />
                    <Field label="Company size" value={basics.company_size} onChange={setBasic('company_size')} placeholder="51-200 employees" />
                    <Field label="Year founded" type="number" value={basics.year_founded} onChange={setBasic('year_founded')} />
                    <div>
                        <span className={labelClass}>Company logo</span>
                        <div className="mt-1 flex items-center gap-3">
                            {basics.company_logo_url && <img src={basics.company_logo_url} alt="" className="h-10 w-10 rounded-lg border border-slate-200 object-cover" />}
                            <label className="cursor-pointer rounded-full bg-cyan-50 px-3 py-2 font-mono text-[11px] font-bold text-cyan-700 hover:bg-cyan-100">
                                {logoUploading ? 'Uploading…' : basics.company_logo_url ? 'Replace' : 'Upload'}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    disabled={logoUploading}
                                    onChange={async e => {
                                        const file = e.target.files?.[0];
                                        e.target.value = '';
                                        if (!file) return;
                                        setLogoUploading(true);
                                        try {
                                            const url = await uploadImage(file);
                                            setBasics(prev => ({ ...prev, company_logo_url: url }));
                                        } catch (err) {
                                            showToast(err instanceof Error ? err.message : 'Logo upload failed.', 'error');
                                        } finally {
                                            setLogoUploading(false);
                                        }
                                    }}
                                />
                            </label>
                        </div>
                    </div>
                    <Field label="Address" value={page.address} onChange={setPageField('address')} wide />
                    <Field label="Phone" value={basics.phone} onChange={setBasic('phone')} />
                    <Field label="Email" type="email" value={page.email} onChange={setPageField('email')} />
                    <Field label="Website" type="url" value={basics.website_url} onChange={setBasic('website_url')} />
                    <Field label="LinkedIn URL" type="url" value={page.linkedin_url} onChange={setPageField('linkedin_url')} />
                    <Field label="Facebook URL" type="url" value={page.facebook_url} onChange={setPageField('facebook_url')} />
                    <Field label="Instagram URL" type="url" value={page.instagram_url} onChange={setPageField('instagram_url')} />
                    <Field label="Hero background video URL" type="url" value={page.hero_video_url} onChange={setPageField('hero_video_url')} hint="Direct .mp4 link. Leave blank to use the EZJOB default loop." wide />
                </div>
            </Panel>

            <Panel title="Key figures" description="Shown as stat tiles under the introduction (e.g. 500+ / Professionals supplied).">
                <ListEditor<Stat> items={page.stats ?? []} onChange={setPageField('stats')} itemLabel="Figure" emptyItem={{ value: '', label: '' }}
                    fields={[{ key: 'value', label: 'Value' }, { key: 'label', label: 'Label' }]} />
            </Panel>

            <Panel title="2. Scope of work — capabilities" description="What the company does for clients.">
                <ListEditor<Capability> items={page.capabilities ?? []} onChange={setPageField('capabilities')} itemLabel="Capability" emptyItem={{ title: '', description: '' }}
                    fields={[{ key: 'title', label: 'Title', wide: true }, { key: 'description', label: 'Description', type: 'textarea', wide: true }]} />
            </Panel>

            <Panel title="Sectors served">
                <ListEditor<Sector> items={page.sectors ?? []} onChange={setPageField('sectors')} itemLabel="Sector" emptyItem={{ title: '', description: '', focus: '' }}
                    fields={[{ key: 'title', label: 'Sector', wide: true }, { key: 'description', label: 'Description', type: 'textarea' }, { key: 'focus', label: 'Project focus', type: 'textarea' }]} />
            </Panel>

            <Panel title="Recent projects / experience">
                <ListEditor<Project> items={page.projects ?? []} onChange={setPageField('projects')} itemLabel="Project" emptyItem={{ title: '', sector: '', summary: '' }}
                    fields={[{ key: 'title', label: 'Title' }, { key: 'sector', label: 'Sector / client type' }, { key: 'summary', label: 'Summary', type: 'textarea', wide: true }]} />
            </Panel>

            <Panel title="3. Available job posts" description="Pulled automatically from this company's Active jobs — nothing to edit here." >
                <p className="text-sm text-slate-600">Jobs are managed from the employer's own dashboard (or Employer Management).</p>
            </Panel>

            <Panel title="4. Talents who joined & testimonials" description="Scrolling talent strip under the hero; hovering a talent shows their testimonial. Only publish real testimonials with the worker's consent.">
                <ListEditor<Talent> items={page.talents ?? []} onChange={setPageField('talents')} itemLabel="Talent" emptyItem={{ name: '', role: '', avatar_url: '', testimonial: '', rating: 5 }}
                    onUpload={uploadImage}
                    fields={[
                        { key: 'name', label: 'Name' },
                        { key: 'role', label: 'Role' },
                        { key: 'avatar_url', label: 'Photo', type: 'image', wide: true },
                        { key: 'testimonial', label: 'Testimonial', type: 'textarea', wide: true },
                        { key: 'rating', label: 'Rating (1–5)', type: 'number' },
                    ]} />
            </Panel>

            <div className="flex justify-end font-mono text-xs">
                <button type="button" onClick={handleSave} disabled={saving || logoUploading} className="px-6 py-2.5 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold shadow-md disabled:opacity-50">
                    {saving ? 'Saving…' : 'Save page'}
                </button>
            </div>
        </div>
    );
};

const CreateCompanyForm: React.FC<{ onCancel: () => void; onCreated: (employer: EmployerProfile) => void }> = ({ onCancel, onCreated }) => {
    const { showToast } = useToast();
    const [form, setForm] = useState({ company_name: '', email: '', industry: '', website_url: '', phone: '' });
    const [submitting, setSubmitting] = useState(false);
    const set = (key: keyof typeof form) => (value: string) => setForm(prev => ({ ...prev, [key]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const { userId } = await createCompanyAccount(form);
            showToast(`${form.company_name} created.`, 'success');
            onCreated({
                id: '',
                user_id: userId,
                company_name: form.company_name,
                industry: form.industry,
                website_url: form.website_url,
                phone: form.phone,
                status: 'Active',
            });
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Failed to create company.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <div>
                <h2 className="text-xl font-extrabold text-slate-900">Create company</h2>
                <p className="text-xs text-slate-500 mt-1">
                    Creates an employer login for this email plus an empty company profile. The company can take the account over later with “Forgot password”.
                </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Company name *" value={form.company_name} onChange={set('company_name')} />
                <Field label="Company email (login) *" type="email" value={form.email} onChange={set('email')} />
                <Field label="Industry" value={form.industry} onChange={set('industry')} />
                <Field label="Website" type="url" value={form.website_url} onChange={set('website_url')} />
                <Field label="Phone" value={form.phone} onChange={set('phone')} />
            </div>
            <div className="flex justify-end gap-2 font-mono text-xs">
                <button type="button" onClick={onCancel} className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold">Cancel</button>
                <button type="submit" disabled={submitting || !form.company_name.trim() || !form.email.trim()} className="px-6 py-2.5 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold shadow-md disabled:opacity-50">
                    {submitting ? 'Creating…' : 'Create & edit page'}
                </button>
            </div>
        </form>
    );
};

/** Admin module: list hiring companies and manage each one's public page. */
const CompanyPagesManager: React.FC = () => {
    const [employers, setEmployers] = useState<EmployerProfile[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState<EmployerProfile | null>(null);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
        return () => clearTimeout(timer);
    }, [search]);
    useEffect(() => { setPage(1); }, [debouncedSearch]);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getAllEmployers({ page, pageSize: PAGE_SIZE, search: debouncedSearch || undefined });
            setEmployers(result.employers);
            setTotal(result.total);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load companies.');
        } finally {
            setLoading(false);
        }
    }, [page, debouncedSearch]);

    useEffect(() => { load(); }, [load]);

    if (editing) {
        return <CompanyPageEditor employer={editing} onClose={() => { setEditing(null); load(); }} onSaved={load} />;
    }
    if (creating) {
        return <CreateCompanyForm onCancel={() => setCreating(false)} onCreated={employer => { setCreating(false); setEditing(employer); }} />;
    }

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-900">Company Pages</h2>
                    <p className="text-xs font-mono text-slate-500 mt-1">Public showcase page for every hiring company</p>
                </div>
                <button onClick={() => setCreating(true)} className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs uppercase px-4 py-2.5 rounded-full font-bold shadow-md">
                    + Create Company
                </button>
            </div>
            <input
                type="text"
                placeholder="Search by company name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full mb-4 px-4 py-2.5 border border-slate-200 rounded-xl font-mono text-sm focus:outline-none focus:border-cyan-500"
            />
            {error && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-mono flex items-center justify-between gap-4">
                    <span>{error}</span>
                    <button onClick={load} className="font-bold underline shrink-0">Retry</button>
                </div>
            )}
            {loading ? (
                <div className="py-16"><Spinner /></div>
            ) : (
                <>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="min-w-full divide-y divide-slate-200 font-mono text-xs">
                            <thead className="bg-slate-900 text-white">
                                <tr>
                                    <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-cyan-400">Company</th>
                                    <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-300">Industry</th>
                                    <th className="px-6 py-3.5 text-right font-bold uppercase tracking-wider text-slate-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {employers.length === 0 && (
                                    <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-400 italic">No companies found.</td></tr>
                                )}
                                {employers.map(employer => (
                                    <tr key={employer.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900">{employer.company_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-600">{employer.industry || '—'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right font-bold space-x-3">
                                            <a href={`/employer/profile/${employer.user_id}`} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-900">View ↗</a>
                                            <button onClick={() => setEditing(employer)} className="text-cyan-700 hover:text-cyan-600">Edit Page</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex items-center justify-between mt-4 font-mono text-xs text-slate-600">
                        <span>Page {page} of {totalPages} &middot; {total} total</span>
                        <div className="space-x-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 rounded-lg border border-slate-200 font-bold disabled:opacity-40 hover:bg-slate-50">&larr; Prev</button>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1.5 rounded-lg border border-slate-200 font-bold disabled:opacity-40 hover:bg-slate-50">Next &rarr;</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default CompanyPagesManager;
