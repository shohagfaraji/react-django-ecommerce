import { useMemo, useState } from "react";
import { useAlert } from "../../context/AlertContext";
import { adminRequest } from "../../utils/admin";
import useAdminCollection from "./useAdminCollection";
import { money } from "./adminConfig";
import { invalidateStoreProductCaches } from "../../utils/apiCache";
import {
    CheckField,
    CollectionState,
    ConfirmDialog,
    FeatureTags,
    Field,
    FormActions,
    ImagePicker,
    ManagementPanel,
    Modal,
    ProductImage,
    RowActions,
    SearchBox,
    Stars,
    Td,
    Th,
} from "./AdminUi";

function ProductsManager({ active, onChanged }) {
    const baseUrl = import.meta.env.VITE_DJANGO_BASE_URL;
    const products = useAdminCollection("products/?limit=200", active);
    const categories = useAdminCollection("categories/", active);
    const [search, setSearch] = useState("");
    const [editing, setEditing] = useState(null);
    const [formOpen, setFormOpen] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const { showAlert } = useAlert();

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return products.data;
        return products.data.filter(
            (product) =>
                product.name.toLowerCase().includes(term) ||
                product.category_name.toLowerCase().includes(term),
        );
    }, [products.data, search]);

    const openCreate = () => {
        setEditing(null);
        setFormOpen(true);
    };

    const openEdit = (product) => {
        setEditing(product);
        setFormOpen(true);
    };

    const saveProduct = async (formData) => {
        const saved = await adminRequest(
            baseUrl,
            editing ? `products/${editing.id}/` : "products/",
            {
                method: editing ? "PATCH" : "POST",
                body: formData,
            },
        );
        products.setData((current) =>
            editing
                ? current.map((item) => (item.id === saved.id ? saved : item))
                : [saved, ...current],
        );
        setFormOpen(false);
        invalidateStoreProductCaches();
        showAlert(editing ? "Product updated" : "Product created");
        onChanged();
    };

    const deleteProduct = async () => {
        try {
            await adminRequest(baseUrl, `products/${deleting.id}/`, {
                method: "DELETE",
            });
            products.setData((current) =>
                current.filter((item) => item.id !== deleting.id),
            );
            invalidateStoreProductCaches();
            setDeleting(null);
            showAlert("Product deleted");
            onChanged();
        } catch (error) {
            showAlert(error.message, "error");
            setDeleting(null);
        }
    };

    return (
        <ManagementPanel
            title="Products"
            copy="Manage product information, inventory, pricing and storefront placement."
            action="Add product"
            onAction={openCreate}
        >
            <SearchBox
                value={search}
                onChange={setSearch}
                placeholder="Search products or categories"
            />
            <CollectionState
                loading={products.loading}
                error={products.error}
                onRetry={products.load}
                empty={!filtered.length}
                emptyMessage="No products match your search."
            >
                <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[940px] text-left">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <Th>Product</Th>
                                <Th>Category</Th>
                                <Th>Price</Th>
                                <Th>Inventory</Th>
                                <Th>Rating</Th>
                                <Th>Placement</Th>
                                <Th align="right">Actions</Th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.map((product) => (
                                <tr key={product.id}>
                                    <Td>
                                        <div className="flex min-w-[240px] items-center gap-3">
                                            <ProductImage product={product} />
                                            <div className="min-w-0">
                                                <p className="max-w-[280px] truncate font-black text-slate-900">
                                                    {product.name}
                                                </p>
                                                <p className="text-xs font-semibold text-slate-400">
                                                    Product #{product.id}
                                                </p>
                                            </div>
                                        </div>
                                    </Td>
                                    <Td>{product.category_name}</Td>
                                    <Td>
                                        <p className="font-black text-slate-900">
                                            {money(product.price)}
                                        </p>
                                        {product.discount_percentage > 0 && (
                                            <p className="text-xs font-bold text-emerald-700">
                                                {product.discount_percentage}% off
                                            </p>
                                        )}
                                    </Td>
                                    <Td>
                                        <InventoryBadge product={product} />
                                    </Td>
                                    <Td>
                                        <Stars
                                            rating={Number(product.average_rating)}
                                            compact
                                        />
                                        <p className="mt-1 text-xs text-slate-400">
                                            {product.review_count} reviews
                                        </p>
                                    </Td>
                                    <Td>
                                        <FeatureTags product={product} />
                                    </Td>
                                    <Td align="right">
                                        <RowActions
                                            onEdit={() => openEdit(product)}
                                            onDelete={() => setDeleting(product)}
                                            label={product.name}
                                        />
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="grid gap-4 p-4 md:hidden">
                    {filtered.map((product) => (
                        <article
                            key={product.id}
                            className="rounded-xl border border-slate-200 p-4"
                        >
                            <div className="flex items-start gap-3">
                                <ProductImage product={product} large />
                                <div className="min-w-0 flex-1">
                                    <p className="font-black text-slate-950">
                                        {product.name}
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-slate-500">
                                        {product.category_name}
                                    </p>
                                    <p className="mt-2 text-lg font-black text-emerald-700">
                                        {money(product.price)}
                                    </p>
                                    <div className="mt-2">
                                        <InventoryBadge product={product} />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                                <FeatureTags product={product} />
                                <RowActions
                                    onEdit={() => openEdit(product)}
                                    onDelete={() => setDeleting(product)}
                                    label={product.name}
                                />
                            </div>
                        </article>
                    ))}
                </div>
            </CollectionState>

            {formOpen && (
                <ProductForm
                    product={editing}
                    categories={categories.data}
                    onClose={() => setFormOpen(false)}
                    onSave={saveProduct}
                />
            )}
            {deleting && (
                <ConfirmDialog
                    title="Delete this product?"
                    message={`“${deleting.name}” will be permanently removed. Products that appear in order history cannot be deleted.`}
                    confirmLabel="Delete product"
                    onCancel={() => setDeleting(null)}
                    onConfirm={deleteProduct}
                />
            )}
        </ManagementPanel>
    );
}

function ProductForm({ product, categories, onClose, onSave }) {
    const [values, setValues] = useState(() => ({
        name: product?.name || "",
        description: product?.description || "",
        price: product?.price || "",
        category: product?.category || categories[0]?.id || "",
        discount_percentage: product?.discount_percentage || 0,
        track_inventory: product?.track_inventory ?? true,
        stock_quantity: product?.stock_quantity ?? 0,
        low_stock_threshold: product?.low_stock_threshold ?? 5,
        is_hot: product?.is_hot || false,
        is_featured: product?.is_featured || false,
        is_weekly_top: product?.is_weekly_top || false,
    }));
    const [image, setImage] = useState({
        file: null,
        preview: product?.image_url || "",
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

    const chooseImage = (file) => {
        if (!file) return;
        setImage({ file, preview: URL.createObjectURL(file) });
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
            title={product ? "Edit product" : "Add product"}
            copy="Manage product information and homepage placement."
            onClose={onClose}
            wide
        >
            <form onSubmit={submit} className="space-y-5">
                <ImagePicker
                    preview={image.preview}
                    onChange={chooseImage}
                    label="Product image"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Product name" required>
                        <input
                            name="name"
                            value={values.name}
                            onChange={updateValue}
                            required
                            className="form-control"
                        />
                    </Field>
                    <Field label="Category" required>
                        <select
                            name="category"
                            value={values.category}
                            onChange={updateValue}
                            required
                            className="form-control"
                        >
                            <option value="">Choose a category</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.parent_name
                                        ? `${category.parent_name} / `
                                        : ""}
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Price" required>
                        <input
                            name="price"
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={values.price}
                            onChange={updateValue}
                            required
                            className="form-control"
                        />
                    </Field>
                    <Field label="Discount percentage">
                        <input
                            name="discount_percentage"
                            type="number"
                            min="0"
                            max="100"
                            value={values.discount_percentage}
                            onChange={updateValue}
                            className="form-control"
                        />
                    </Field>
                </div>
                <Field label="Description">
                    <textarea
                        name="description"
                        rows="4"
                        value={values.description}
                        onChange={updateValue}
                        className="form-control resize-y py-3"
                    />
                </Field>
                <div>
                    <p className="mb-3 text-sm font-black text-slate-700">
                        Inventory
                    </p>
                    <div className="space-y-3">
                        <CheckField
                            name="track_inventory"
                            checked={values.track_inventory}
                            onChange={updateValue}
                            label="Track available stock"
                        />
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Available quantity" required>
                                <input
                                    name="stock_quantity"
                                    type="number"
                                    min="0"
                                    value={values.stock_quantity}
                                    onChange={updateValue}
                                    required
                                    disabled={!values.track_inventory}
                                    className="form-control disabled:bg-slate-100 disabled:text-slate-400"
                                />
                            </Field>
                            <Field label="Low-stock warning at" required>
                                <input
                                    name="low_stock_threshold"
                                    type="number"
                                    min="0"
                                    value={values.low_stock_threshold}
                                    onChange={updateValue}
                                    required
                                    disabled={!values.track_inventory}
                                    className="form-control disabled:bg-slate-100 disabled:text-slate-400"
                                />
                            </Field>
                        </div>
                        <p className="text-xs font-semibold leading-5 text-slate-500">
                            When tracking is disabled, customers can order this
                            product without a stock limit.
                        </p>
                    </div>
                </div>
                <div>
                    <p className="mb-3 text-sm font-black text-slate-700">
                        Store placement
                    </p>
                    <div className="grid gap-3 sm:grid-cols-3">
                        <CheckField
                            name="is_featured"
                            checked={values.is_featured}
                            onChange={updateValue}
                            label="Featured"
                        />
                        <CheckField
                            name="is_hot"
                            checked={values.is_hot}
                            onChange={updateValue}
                            label="Hot product"
                        />
                        <CheckField
                            name="is_weekly_top"
                            checked={values.is_weekly_top}
                            onChange={updateValue}
                            label="Weekly top"
                        />
                    </div>
                </div>
                <FormActions
                    saving={saving}
                    error={error}
                    submitLabel={product ? "Save changes" : "Create product"}
                    onCancel={onClose}
                />
            </form>
        </Modal>
    );
}

function InventoryBadge({ product }) {
    if (!product.track_inventory) {
        return (
            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">
                Not tracked
            </span>
        );
    }
    if (!product.is_in_stock) {
        return (
            <span className="inline-flex rounded-full bg-[#b62324]/10 px-2.5 py-1 text-xs font-black text-[#b62324]">
                Out of stock
            </span>
        );
    }
    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${
                product.is_low_stock
                    ? "bg-amber-50 text-amber-700"
                    : "bg-emerald-50 text-emerald-700"
            }`}
        >
            {product.stock_quantity} in stock
        </span>
    );
}


export default ProductsManager;
