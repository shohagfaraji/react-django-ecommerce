import { useMemo, useState } from "react";
import { FaLayerGroup } from "react-icons/fa";
import { useAlert } from "../../context/AlertContext";
import { adminRequest } from "../../utils/admin";
import useAdminCollection from "./useAdminCollection";
import {
    CATEGORY_SECTIONS,
    formatDate,
    toDateTimeInput,
} from "./adminConfig";
import {
    CheckField,
    CollectionState,
    ConfirmDialog,
    Field,
    FormActions,
    ImagePicker,
    ManagementPanel,
    Modal,
    RowActions,
    SearchBox,
    SmallTag,
} from "./AdminUi";

function CategoriesManager({ active, onChanged }) {
    const baseUrl = import.meta.env.VITE_DJANGO_BASE_URL;
    const categories = useAdminCollection("categories/", active);
    const [search, setSearch] = useState("");
    const [editing, setEditing] = useState(null);
    const [formOpen, setFormOpen] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const { showAlert } = useAlert();

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return categories.data;
        return categories.data.filter(
            (category) =>
                category.name.toLowerCase().includes(term) ||
                category.slug.toLowerCase().includes(term) ||
                category.section.toLowerCase().includes(term),
        );
    }, [categories.data, search]);

    const saveCategory = async (formData) => {
        const saved = await adminRequest(
            baseUrl,
            editing ? `categories/${editing.id}/` : "categories/",
            {
                method: editing ? "PATCH" : "POST",
                body: formData,
            },
        );
        categories.setData((current) =>
            editing
                ? current.map((item) => (item.id === saved.id ? saved : item))
                : [...current, saved].sort((a, b) =>
                      a.name.localeCompare(b.name),
                  ),
        );
        setFormOpen(false);
        showAlert(editing ? "Category updated" : "Category created");
        onChanged();
    };

    const deleteCategory = async () => {
        try {
            await adminRequest(baseUrl, `categories/${deleting.id}/`, {
                method: "DELETE",
            });
            categories.setData((current) =>
                current.filter((item) => item.id !== deleting.id),
            );
            setDeleting(null);
            showAlert("Category deleted");
            onChanged();
        } catch (error) {
            showAlert(error.message, "error");
            setDeleting(null);
        }
    };

    return (
        <ManagementPanel
            title="Categories"
            copy="Organize the catalog and control which departments appear on the storefront."
            action="Add category"
            onAction={() => {
                setEditing(null);
                setFormOpen(true);
            }}
        >
            <SearchBox
                value={search}
                onChange={setSearch}
                placeholder="Search categories"
            />
            <CollectionState
                loading={categories.loading}
                error={categories.error}
                onRetry={categories.load}
                empty={!filtered.length}
                emptyMessage="No categories match your search."
            >
                <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3 lg:p-5">
                    {filtered.map((category) => (
                        <article
                            key={category.id}
                            className="rounded-xl border border-slate-200 p-4"
                        >
                            <div className="flex items-start gap-3">
                                {category.image_url ? (
                                    <img
                                        src={category.image_url}
                                        alt=""
                                        className="h-14 w-14 shrink-0 rounded-xl bg-slate-100 object-cover"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                ) : (
                                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                                        <FaLayerGroup />
                                    </span>
                                )}
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-black text-slate-950">
                                        {category.name}
                                    </p>
                                    <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                                        /{category.slug}
                                    </p>
                                    <p className="mt-2 text-xs font-bold uppercase tracking-wide text-emerald-700">
                                        {category.parent_name || category.section}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                                <div className="flex flex-wrap gap-1">
                                    <SmallTag
                                        active={category.is_active}
                                        label={category.is_active ? "Active" : "Hidden"}
                                    />
                                    {category.is_featured && (
                                        <SmallTag active label="Featured" />
                                    )}
                                </div>
                                <RowActions
                                    onEdit={() => {
                                        setEditing(category);
                                        setFormOpen(true);
                                    }}
                                    onDelete={() => setDeleting(category)}
                                    label={category.name}
                                />
                            </div>
                        </article>
                    ))}
                </div>
            </CollectionState>
            {formOpen && (
                <CategoryForm
                    category={editing}
                    categories={categories.data}
                    onClose={() => setFormOpen(false)}
                    onSave={saveCategory}
                />
            )}
            {deleting && (
                <ConfirmDialog
                    title="Delete this category?"
                    message={`“${deleting.name}” can only be deleted when it has no products, child categories, or linked banners.`}
                    confirmLabel="Delete category"
                    onCancel={() => setDeleting(null)}
                    onConfirm={deleteCategory}
                />
            )}
        </ManagementPanel>
    );
}

function CategoryForm({ category, categories, onClose, onSave }) {
    const [values, setValues] = useState(() => ({
        name: category?.name || "",
        slug: category?.slug || "",
        parent: category?.parent || "",
        section: category?.section || "other",
        description: category?.description || "",
        is_active: category?.is_active ?? true,
        is_featured: category?.is_featured || false,
        sort_order: category?.sort_order || 0,
    }));
    const [image, setImage] = useState({
        file: null,
        preview: category?.image_url || "",
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const updateValue = (event) => {
        const { name, type, checked, value } = event.target;
        setValues((current) => ({
            ...current,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const changeName = (event) => {
        const name = event.target.value;
        setValues((current) => ({
            ...current,
            name,
            slug: category
                ? current.slug
                : name
                      .toLowerCase()
                      .trim()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-|-$/g, ""),
        }));
    };

    const submit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");
        const body = new FormData();
        Object.entries(values).forEach(([key, value]) => body.append(key, value));
        if (image.file) body.append("image_upload", image.file);
        try {
            await onSave(body);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            title={category ? "Edit category" : "Add category"}
            copy="Set catalog hierarchy, visibility and homepage placement."
            onClose={onClose}
            wide
        >
            <form onSubmit={submit} className="space-y-5">
                <ImagePicker
                    preview={image.preview}
                    onChange={(file) =>
                        file &&
                        setImage({ file, preview: URL.createObjectURL(file) })
                    }
                    label="Category image"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Category name" required>
                        <input
                            name="name"
                            value={values.name}
                            onChange={changeName}
                            required
                            className="form-control"
                        />
                    </Field>
                    <Field label="URL slug" required>
                        <input
                            name="slug"
                            value={values.slug}
                            onChange={updateValue}
                            required
                            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                            className="form-control"
                        />
                    </Field>
                    <Field label="Parent category">
                        <select
                            name="parent"
                            value={values.parent}
                            onChange={updateValue}
                            className="form-control"
                        >
                            <option value="">Top-level category</option>
                            {categories
                                .filter((item) => item.id !== category?.id)
                                .map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name}
                                    </option>
                                ))}
                        </select>
                    </Field>
                    <Field label="Store section" required>
                        <select
                            name="section"
                            value={values.section}
                            onChange={updateValue}
                            className="form-control"
                        >
                            {CATEGORY_SECTIONS.map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Sort order">
                        <input
                            name="sort_order"
                            type="number"
                            min="0"
                            value={values.sort_order}
                            onChange={updateValue}
                            className="form-control"
                        />
                    </Field>
                </div>
                <Field label="Short description">
                    <textarea
                        name="description"
                        rows="3"
                        maxLength="240"
                        value={values.description}
                        onChange={updateValue}
                        className="form-control resize-y py-3"
                    />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                    <CheckField
                        name="is_active"
                        checked={values.is_active}
                        onChange={updateValue}
                        label="Visible in store"
                    />
                    <CheckField
                        name="is_featured"
                        checked={values.is_featured}
                        onChange={updateValue}
                        label="Featured on homepage"
                    />
                </div>
                <FormActions
                    saving={saving}
                    error={error}
                    submitLabel={category ? "Save changes" : "Create category"}
                    onCancel={onClose}
                />
            </form>
        </Modal>
    );
}

function BannersManager({ active, onChanged }) {
    const baseUrl = import.meta.env.VITE_DJANGO_BASE_URL;
    const banners = useAdminCollection("banners/", active);
    const categories = useAdminCollection("categories/", active);
    const [editing, setEditing] = useState(null);
    const [formOpen, setFormOpen] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const { showAlert } = useAlert();

    const saveBanner = async (formData) => {
        const saved = await adminRequest(
            baseUrl,
            editing ? `banners/${editing.id}/` : "banners/",
            {
                method: editing ? "PATCH" : "POST",
                body: formData,
            },
        );
        banners.setData((current) =>
            editing
                ? current.map((item) => (item.id === saved.id ? saved : item))
                : [...current, saved],
        );
        setFormOpen(false);
        showAlert(editing ? "Banner updated" : "Banner created");
        onChanged();
    };

    const deleteBanner = async () => {
        try {
            await adminRequest(baseUrl, `banners/${deleting.id}/`, {
                method: "DELETE",
            });
            banners.setData((current) =>
                current.filter((item) => item.id !== deleting.id),
            );
            setDeleting(null);
            showAlert("Banner deleted");
            onChanged();
        } catch (error) {
            showAlert(error.message, "error");
            setDeleting(null);
        }
    };

    return (
        <ManagementPanel
            title="Hero banners"
            copy="Manage homepage campaigns, timing and destination categories."
            action="Add banner"
            onAction={() => {
                setEditing(null);
                setFormOpen(true);
            }}
        >
            <CollectionState
                loading={banners.loading}
                error={banners.error}
                onRetry={banners.load}
                empty={!banners.data.length}
                emptyMessage="No hero banners have been created."
            >
                <div className="grid gap-5 p-4 xl:grid-cols-2 lg:p-5">
                    {banners.data.map((banner) => (
                        <article
                            key={banner.id}
                            className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                        >
                            <div className="relative aspect-[2.4/1] bg-slate-100">
                                <img
                                    src={banner.image_url}
                                    alt=""
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                    decoding="async"
                                />
                                <div className="absolute left-3 top-3 flex gap-2">
                                    <SmallTag
                                        active={banner.is_active}
                                        label={banner.is_active ? "Active" : "Inactive"}
                                        solid
                                    />
                                    {banner.show_on_home && (
                                        <SmallTag active label="Homepage" solid />
                                    )}
                                </div>
                            </div>
                            <div className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className="truncate text-lg font-black text-slate-950">
                                            {banner.title}
                                        </p>
                                        <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                                            {banner.subtitle || "No subtitle"}
                                        </p>
                                    </div>
                                    <RowActions
                                        onEdit={() => {
                                            setEditing(banner);
                                            setFormOpen(true);
                                        }}
                                        onDelete={() => setDeleting(banner)}
                                        label={banner.title}
                                    />
                                </div>
                                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-xs">
                                    <div>
                                        <p className="font-bold text-slate-400">Destination</p>
                                        <p className="mt-1 font-black text-slate-700">
                                            {banner.category_name || "Storefront"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-400">Schedule</p>
                                        <p className="mt-1 font-black text-slate-700">
                                            {banner.starts_at || banner.ends_at
                                                ? `${formatDate(banner.starts_at, false)} – ${formatDate(
                                                      banner.ends_at,
                                                      false,
                                                  )}`
                                                : "Always available"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </CollectionState>
            {formOpen && (
                <BannerForm
                    banner={editing}
                    categories={categories.data.filter(
                        (category) => !category.parent && category.is_active,
                    )}
                    onClose={() => setFormOpen(false)}
                    onSave={saveBanner}
                />
            )}
            {deleting && (
                <ConfirmDialog
                    title="Delete this banner?"
                    message={`“${deleting.title}” and its uploaded image will be permanently removed.`}
                    confirmLabel="Delete banner"
                    onCancel={() => setDeleting(null)}
                    onConfirm={deleteBanner}
                />
            )}
        </ManagementPanel>
    );
}

function BannerForm({ banner, categories, onClose, onSave }) {
    const [values, setValues] = useState(() => ({
        title: banner?.title || "",
        subtitle: banner?.subtitle || "",
        category: banner?.category || "",
        button_text: banner?.button_text || "Shop now",
        is_active: banner?.is_active ?? true,
        show_on_home: banner?.show_on_home ?? true,
        starts_at: toDateTimeInput(banner?.starts_at),
        ends_at: toDateTimeInput(banner?.ends_at),
        sort_order: banner?.sort_order || 0,
    }));
    const [image, setImage] = useState({
        file: null,
        preview: banner?.image_url || "",
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const updateValue = (event) => {
        const { name, type, checked, value } = event.target;
        setValues((current) => ({
            ...current,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const submit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");
        const body = new FormData();
        Object.entries(values).forEach(([key, value]) => body.append(key, value));
        if (image.file) body.append("image_upload", image.file);
        try {
            await onSave(body);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            title={banner ? "Edit hero banner" : "Add hero banner"}
            copy="Choose the campaign image, destination and display period."
            onClose={onClose}
            wide
        >
            <form onSubmit={submit} className="space-y-5">
                <ImagePicker
                    preview={image.preview}
                    onChange={(file) =>
                        file &&
                        setImage({ file, preview: URL.createObjectURL(file) })
                    }
                    label="Banner image"
                    banner
                    required={!banner}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Banner title" required>
                        <input
                            name="title"
                            value={values.title}
                            onChange={updateValue}
                            required
                            className="form-control"
                        />
                    </Field>
                    <Field label="Button text" required>
                        <input
                            name="button_text"
                            value={values.button_text}
                            onChange={updateValue}
                            required
                            className="form-control"
                        />
                    </Field>
                    <Field label="Destination category">
                        <select
                            name="category"
                            value={values.category}
                            onChange={updateValue}
                            className="form-control"
                        >
                            <option value="">Storefront</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Sort order">
                        <input
                            name="sort_order"
                            type="number"
                            min="0"
                            value={values.sort_order}
                            onChange={updateValue}
                            className="form-control"
                        />
                    </Field>
                    <Field label="Starts at">
                        <input
                            name="starts_at"
                            type="datetime-local"
                            value={values.starts_at}
                            onChange={updateValue}
                            className="form-control"
                        />
                    </Field>
                    <Field label="Ends at">
                        <input
                            name="ends_at"
                            type="datetime-local"
                            value={values.ends_at}
                            onChange={updateValue}
                            className="form-control"
                        />
                    </Field>
                </div>
                <Field label="Subtitle">
                    <textarea
                        name="subtitle"
                        rows="3"
                        maxLength="300"
                        value={values.subtitle}
                        onChange={updateValue}
                        className="form-control resize-y py-3"
                    />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                    <CheckField
                        name="is_active"
                        checked={values.is_active}
                        onChange={updateValue}
                        label="Banner is active"
                    />
                    <CheckField
                        name="show_on_home"
                        checked={values.show_on_home}
                        onChange={updateValue}
                        label="Show on homepage"
                    />
                </div>
                <FormActions
                    saving={saving}
                    error={error}
                    submitLabel={banner ? "Save changes" : "Create banner"}
                    onCancel={onClose}
                />
            </form>
        </Modal>
    );
}


export { BannersManager, CategoriesManager };
