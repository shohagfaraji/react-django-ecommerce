import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
    FaBoxOpen,
    FaCamera,
    FaChevronRight,
    FaEnvelope,
    FaExclamationTriangle,
    FaKey,
    FaMapMarkerAlt,
    FaPhone,
    FaSave,
    FaSignOutAlt,
    FaTrash,
    FaUser,
    FaUserCircle,
} from "react-icons/fa";
import { useAlert } from "../context/AlertContext";
import { useCart } from "../context/CartContext";
import { authFetch, clearTokens } from "../utils/auth";
import { formatDate } from "../utils/orders";

const DEFAULT_AVATAR = "/default-avatar.svg";

function ProfilePage() {
    const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;
    const [searchParams, setSearchParams] = useSearchParams();
    const requestedSection = searchParams.get("section");
    const activeSection = ["orders", "security"].includes(requestedSection)
        ? requestedSection
        : "profile";
    const [profile, setProfile] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    useEffect(() => {
        const loadAccount = async () => {
            setLoading(true);
            setLoadError("");
            try {
                const [profileRes, ordersRes] = await Promise.all([
                    authFetch(`${BASEURL}/api/profile/`),
                    authFetch(`${BASEURL}/api/orders/`),
                ]);
                if (!profileRes.ok || !ordersRes.ok) {
                    throw new Error("Could not load your account.");
                }
                const [profileData, orderData] = await Promise.all([
                    profileRes.json(),
                    ordersRes.json(),
                ]);
                setProfile(profileData);
                setOrders(orderData);
            } catch (error) {
                setLoadError(error.message || "Could not load your account.");
            } finally {
                setLoading(false);
            }
        };
        void loadAccount();
    }, [BASEURL]);

    if (loading) return <AccountLoading />;
    if (loadError || !profile) {
        return (
            <main className="min-h-screen bg-[#f6f7f9] px-4 pt-36 pb-12 md:pt-28">
                <div className="mx-auto max-w-3xl rounded-xl border border-rose-200 bg-white p-8 text-center shadow-sm">
                    <h1 className="text-2xl font-black text-slate-950">
                        Your account could not be loaded
                    </h1>
                    <p className="mt-2 text-sm font-semibold text-rose-600">
                        {loadError}
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#f6f7f9] px-4 pt-36 pb-12 md:pt-28">
            <div className="mx-auto max-w-6xl">
                <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
                    <aside className="h-fit rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                        <AccountSummary profile={profile} />
                        <nav className="mt-3 space-y-1" aria-label="Account">
                            <SectionButton
                                active={activeSection === "profile"}
                                icon={<FaUserCircle />}
                                onClick={() => setSearchParams({})}
                            >
                                Personal details
                            </SectionButton>
                            <SectionButton
                                active={activeSection === "orders"}
                                icon={<FaBoxOpen />}
                                onClick={() =>
                                    setSearchParams({ section: "orders" })
                                }
                            >
                                My orders
                                <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                                    {orders.length}
                                </span>
                            </SectionButton>
                            <SectionButton
                                active={activeSection === "security"}
                                icon={<FaKey />}
                                onClick={() =>
                                    setSearchParams({ section: "security" })
                                }
                            >
                                Security
                            </SectionButton>
                        </nav>
                    </aside>

                    {activeSection === "profile" && (
                        <PersonalDetails
                            profile={profile}
                            onProfileChanged={setProfile}
                        />
                    )}
                    {activeSection === "orders" && <Orders orders={orders} />}
                    {activeSection === "security" && <Security />}
                </div>
            </div>
        </main>
    );
}

function AccountSummary({ profile }) {
    return (
        <div className="flex items-center gap-3 border-b border-slate-100 px-2 pb-4">
            <img
                src={profile.profile_picture_url || DEFAULT_AVATAR}
                alt={`${profile.username}'s profile`}
                className="h-12 w-12 rounded-full border border-slate-200 object-cover"
            />
            <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-950">
                    {profile.name || profile.username}
                </p>
                <p className="truncate text-xs font-semibold text-slate-500">
                    @{profile.username}
                </p>
            </div>
        </div>
    );
}

function SectionButton({ active, icon, onClick, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-black transition ${
                active
                    ? "bg-emerald-50 text-emerald-800"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            }`}
        >
            <span>{icon}</span>
            {children}
        </button>
    );
}

function PersonalDetails({ profile, onProfileChanged }) {
    const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;
    const { showAlert } = useAlert();
    const fileRef = useRef(null);
    const [form, setForm] = useState({
        username: profile.username,
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        address: profile.address || "",
    });
    const [picture, setPicture] = useState(null);
    const [preview, setPreview] = useState(
        profile.profile_picture_url || DEFAULT_AVATAR,
    );
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [usernameStatus, setUsernameStatus] = useState({
        state: "idle",
        message: "",
    });

    useEffect(
        () => () => {
            if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
        },
        [preview],
    );

    useEffect(() => {
        const rawUsername = form.username;
        const username = rawUsername.trim();

        if (username.toLowerCase() === profile.username.toLowerCase()) {
            setUsernameStatus({ state: "idle", message: "" });
            return undefined;
        }
        if (!username) {
            setUsernameStatus({
                state: "invalid",
                message: "Enter a username.",
            });
            return undefined;
        }
        if (/\s/.test(rawUsername)) {
            setUsernameStatus({
                state: "invalid",
                message: "Username cannot contain spaces.",
            });
            return undefined;
        }

        const controller = new AbortController();
        setUsernameStatus({
            state: "checking",
            message: "Checking username...",
        });
        const timer = window.setTimeout(async () => {
            try {
                const res = await authFetch(
                    `${BASEURL}/api/register/check-username/?username=${encodeURIComponent(username)}`,
                    { signal: controller.signal },
                );
                const data = await res.json();
                setUsernameStatus({
                    state: res.ok && data.available ? "available" : "taken",
                    message:
                        data.message ||
                        (res.ok
                            ? "Username is available."
                            : "This username is already taken."),
                });
            } catch (error) {
                if (error.name !== "AbortError") {
                    setUsernameStatus({
                        state: "idle",
                        message: "Could not check username right now.",
                    });
                }
            }
        }, 350);

        return () => {
            controller.abort();
            window.clearTimeout(timer);
        };
    }, [BASEURL, form.username, profile.username]);

    const handlePicture = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            setErrors({ profile_picture: ["Choose an image file."] });
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setErrors({
                profile_picture: ["Profile picture must be 5 MB or smaller."],
            });
            return;
        }
        if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
        setPicture(file);
        setPreview(URL.createObjectURL(file));
        setErrors({});
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setErrors({});
        const body = new FormData();
        Object.entries(form).forEach(([key, value]) => body.append(key, value));
        if (picture) body.append("profile_picture", picture);

        try {
            const res = await authFetch(`${BASEURL}/api/profile/`, {
                method: "PATCH",
                body,
            });
            const data = await res.json();
            if (!res.ok) {
                setErrors(data);
                return;
            }
            onProfileChanged(data);
            setPicture(null);
            setPreview(data.profile_picture_url || DEFAULT_AVATAR);
            localStorage.setItem("username", data.username);
            localStorage.setItem("email", data.email || "");
            window.dispatchEvent(new Event("winkelo:profile-updated"));
            showAlert("Profile updated");
        } catch {
            setErrors({ detail: ["Could not update your profile."] });
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-2xl font-black text-slate-950">
                Personal details
            </h2>
            <p className="mt-1 text-sm text-slate-500">
                Your phone and address start empty and can be added whenever
                you’re ready.
            </p>

            <form onSubmit={handleSubmit} className="mt-7">
                <div className="mb-7 flex flex-col items-center gap-5 rounded-xl bg-slate-50 p-4 text-center sm:flex-row sm:text-left">
                    <div className="relative">
                        <img
                            src={preview}
                            alt="Profile preview"
                            className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-sm"
                        />
                        <button
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            className="absolute right-0 bottom-0 flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-white shadow transition hover:bg-emerald-700"
                            aria-label="Change profile picture"
                        >
                            <FaCamera size={14} />
                        </button>
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            onChange={handlePicture}
                            className="hidden"
                        />
                    </div>
                    <div>
                        <p className="font-black text-slate-900">
                            Profile picture
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                            JPG, PNG, GIF or WebP. Maximum 5 MB.
                        </p>
                        {errors.profile_picture && (
                            <FieldError error={errors.profile_picture} />
                        )}
                    </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                    <ProfileField
                        label="Username"
                        icon={<FaUser />}
                        value={form.username}
                        onChange={(value) =>
                            setForm({ ...form, username: value })
                        }
                        error={errors.username}
                        help={usernameStatus.message}
                        tone={usernameStatus.state}
                        required
                    />
                    <ProfileField
                        label="Full name"
                        icon={<FaUserCircle />}
                        value={form.name}
                        onChange={(value) => setForm({ ...form, name: value })}
                        error={errors.name}
                    />
                    <ProfileField
                        label="Email"
                        type="email"
                        icon={<FaEnvelope />}
                        value={form.email}
                        onChange={(value) => setForm({ ...form, email: value })}
                        error={errors.email}
                    />
                    <ProfileField
                        label="Phone"
                        type="tel"
                        icon={<FaPhone />}
                        value={form.phone}
                        onChange={(value) => setForm({ ...form, phone: value })}
                        error={errors.phone}
                    />
                </div>

                <label className="mt-5 block">
                    <span className="mb-2 block text-sm font-black text-slate-700">
                        Address
                    </span>
                    <div className="flex rounded-lg border border-slate-300 bg-white px-3 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
                        <FaMapMarkerAlt className="mt-4 shrink-0 text-slate-400" />
                        <textarea
                            value={form.address}
                            onChange={(event) =>
                                setForm({
                                    ...form,
                                    address: event.target.value,
                                })
                            }
                            rows="3"
                            placeholder="Add your address"
                            className="min-w-0 flex-1 resize-y px-3 py-3 text-sm outline-none"
                        />
                    </div>
                    {errors.address && <FieldError error={errors.address} />}
                </label>

                {errors.detail && <FieldError error={errors.detail} />}

                <div className="mt-6 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-60"
                    >
                        <FaSave />
                        {saving ? "Saving..." : "Save changes"}
                    </button>
                </div>
            </form>
        </section>
    );
}

function ProfileField({
    label,
    icon,
    value,
    onChange,
    error,
    help,
    tone = "idle",
    type = "text",
    required = false,
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-black text-slate-700">
                {label}
            </span>
            <div className="flex h-12 items-center rounded-lg border border-slate-300 bg-white px-3 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
                <span className="text-slate-400">{icon}</span>
                <input
                    type={type}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    required={required}
                    className="h-full min-w-0 flex-1 px-3 text-sm outline-none"
                />
            </div>
            {error ? (
                <FieldError error={error} />
            ) : (
                help && (
                    <p
                        className={`mt-2 text-xs font-bold ${
                            tone === "available"
                                ? "text-emerald-700"
                                : tone === "taken" || tone === "invalid"
                                  ? "text-rose-600"
                                  : "text-slate-500"
                        }`}
                    >
                        {help}
                    </p>
                )
            )}
        </label>
    );
}

function Orders({ orders }) {
    if (!orders.length) {
        return (
            <section className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <FaBoxOpen className="mx-auto text-5xl text-slate-300" />
                <h2 className="mt-4 text-2xl font-black text-slate-950">
                    No orders yet
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                    Your completed checkouts will appear here.
                </p>
                <Link
                    to="/"
                    className="mt-5 inline-flex rounded-lg bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-emerald-700"
                >
                    Start shopping
                </Link>
            </section>
        );
    }

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-2xl font-black text-slate-950">My orders</h2>
            <p className="mt-1 text-sm text-slate-500">
                Orders are permanent records and cannot be removed individually.
            </p>
            <div className="mt-6 space-y-3">
                {orders.map((order) => (
                    <Link
                        key={order.id}
                        to={`/profile/orders/${order.id}`}
                        className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-emerald-300 hover:bg-emerald-50/40"
                    >
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                            <FaBoxOpen />
                        </div>
                        <div className="min-w-[140px] flex-1">
                            <p className="font-black text-slate-950">
                                Order #{order.id}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-slate-500">
                                {formatDate(order.created_at)} ·{" "}
                                {order.item_count}{" "}
                                {order.item_count === 1 ? "item" : "items"}
                            </p>
                        </div>
                        <div className="text-right">
                            <StatusBadge order={order} />
                            <p className="mt-1 text-sm font-black text-slate-950">
                                ${Number(order.total_amount).toFixed(2)}
                            </p>
                        </div>
                        <FaChevronRight className="text-slate-400" />
                    </Link>
                ))}
            </div>
        </section>
    );
}

function Security() {
    const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;
    const navigate = useNavigate();
    const { showAlert } = useAlert();
    const { clearCart } = useCart();
    const [passwords, setPasswords] = useState({
        current_password: "",
        new_password: "",
        confirm_password: "",
    });
    const [passwordErrors, setPasswordErrors] = useState({});
    const [currentPasswordStatus, setCurrentPasswordStatus] = useState({
        state: "idle",
        message: "",
    });
    const [saving, setSaving] = useState(false);
    const [showDelete, setShowDelete] = useState(false);

    const logout = () => {
        clearTokens();
        localStorage.removeItem("username");
        localStorage.removeItem("email");
        clearCart();
        navigate("/login");
    };

    const changePassword = async (event) => {
        event.preventDefault();
        setSaving(true);
        setPasswordErrors({});
        try {
            const res = await authFetch(`${BASEURL}/api/profile/password/`, {
                method: "POST",
                body: JSON.stringify(passwords),
            });
            const data = await res.json();
            if (!res.ok) {
                setPasswordErrors(data);
                return;
            }
            setPasswords({
                current_password: "",
                new_password: "",
                confirm_password: "",
            });
            showAlert("Password changed. Please sign in again.");
            logout();
        } catch {
            setPasswordErrors({
                detail: ["Could not change your password."],
            });
        } finally {
            setSaving(false);
        }
    };

    const checkCurrentPassword = async () => {
        if (!passwords.current_password) {
            setCurrentPasswordStatus({ state: "idle", message: "" });
            return;
        }

        setCurrentPasswordStatus({
            state: "checking",
            message: "Checking current password...",
        });
        try {
            const res = await authFetch(
                `${BASEURL}/api/profile/password/check/`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        current_password: passwords.current_password,
                    }),
                },
            );
            const data = await res.json();
            setCurrentPasswordStatus(
                res.ok && data.matches
                    ? {
                          state: "matched",
                          message: "Current password matched.",
                      }
                    : {
                          state: "mismatch",
                          message: "Current password is incorrect.",
                      },
            );
        } catch {
            setCurrentPasswordStatus({
                state: "idle",
                message: "Could not check the current password.",
            });
        }
    };

    return (
        <div className="space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                <h2 className="text-2xl font-black text-slate-950">
                    Change password
                </h2>
                <form onSubmit={changePassword} className="mt-6 max-w-xl space-y-4">
                    <PasswordField
                        label="Current password"
                        value={passwords.current_password}
                        onChange={(value) => {
                            setPasswords({
                                ...passwords,
                                current_password: value,
                            });
                            setCurrentPasswordStatus({
                                state: "idle",
                                message: "",
                            });
                        }}
                        onBlur={checkCurrentPassword}
                        error={passwordErrors.current_password}
                        help={currentPasswordStatus.message}
                        tone={currentPasswordStatus.state}
                    />
                    <PasswordField
                        label="New password"
                        value={passwords.new_password}
                        onChange={(value) =>
                            setPasswords({
                                ...passwords,
                                new_password: value,
                            })
                        }
                        error={passwordErrors.new_password}
                    />
                    <PasswordField
                        label="Confirm new password"
                        value={passwords.confirm_password}
                        onChange={(value) =>
                            setPasswords({
                                ...passwords,
                                confirm_password: value,
                            })
                        }
                        error={passwordErrors.confirm_password}
                    />
                    {passwordErrors.detail && (
                        <FieldError error={passwordErrors.detail} />
                    )}
                    <button
                        type="submit"
                        disabled={saving}
                        className="h-11 rounded-lg bg-slate-950 px-5 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                        {saving ? "Updating..." : "Update password"}
                    </button>
                </form>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                <h2 className="text-xl font-black text-slate-950">Session</h2>
                <p className="mt-1 text-sm text-slate-500">
                    Sign out on this device when you’re finished.
                </p>
                <button
                    type="button"
                    onClick={logout}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-50"
                >
                    <FaSignOutAlt />
                    Logout
                </button>
            </section>

            <section className="rounded-xl border border-rose-200 bg-rose-50/50 p-5 shadow-sm sm:p-7">
                <h2 className="flex items-center gap-2 text-xl font-black text-rose-700">
                    <FaExclamationTriangle />
                    Delete account
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-rose-700">
                    Permanently deletes your profile, every order and order
                    item, cart, and all other data connected to your account.
                    This cannot be undone.
                </p>
                <button
                    type="button"
                    onClick={() => setShowDelete(true)}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-black text-white hover:bg-rose-700"
                >
                    <FaTrash />
                    Delete my account
                </button>
            </section>

            {showDelete && (
                <DeleteAccountDialog
                    onClose={() => setShowDelete(false)}
                    onDeleted={logout}
                />
            )}
        </div>
    );
}

function PasswordField({
    label,
    value,
    onChange,
    onBlur,
    error,
    help,
    tone = "idle",
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-black text-slate-700">
                {label}
            </span>
            <div className="flex h-12 items-center rounded-lg border border-slate-300 bg-white px-3 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
                <FaKey className="text-slate-400" />
                <input
                    type="password"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    onBlur={onBlur}
                    required
                    className="h-full min-w-0 flex-1 px-3 text-sm outline-none"
                />
            </div>
            {error ? (
                <FieldError error={error} />
            ) : (
                help && (
                    <p
                        className={`mt-2 text-xs font-bold ${
                            tone === "matched"
                                ? "text-emerald-700"
                                : tone === "mismatch"
                                  ? "text-rose-600"
                                  : "text-slate-500"
                        }`}
                    >
                        {help}
                    </p>
                )
            )}
        </label>
    );
}

function DeleteAccountDialog({ onClose, onDeleted }) {
    const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;
    const [form, setForm] = useState({ password: "", confirmation: "" });
    const [errors, setErrors] = useState({});
    const [deleting, setDeleting] = useState(false);
    const canDelete = form.confirmation === "DELETE" && form.password;

    const submit = async (event) => {
        event.preventDefault();
        setDeleting(true);
        setErrors({});
        try {
            const res = await authFetch(`${BASEURL}/api/profile/delete/`, {
                method: "DELETE",
                body: JSON.stringify(form),
            });
            if (res.status === 204) {
                onDeleted();
                return;
            }
            const data = await res.json();
            setErrors(data);
        } catch {
            setErrors({ detail: ["Could not delete your account."] });
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
        >
            <form
                onSubmit={submit}
                className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
            >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                    <FaExclamationTriangle />
                </div>
                <h2
                    id="delete-account-title"
                    className="mt-4 text-2xl font-black text-slate-950"
                >
                    This action is permanent
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                    All profile data, orders, and cart history will be deleted.
                    Enter your password and type{" "}
                    <strong className="text-rose-700">DELETE</strong> to
                    continue.
                </p>
                <div className="mt-5 space-y-4">
                    <PasswordField
                        label="Password"
                        value={form.password}
                        onChange={(value) =>
                            setForm({ ...form, password: value })
                        }
                        error={errors.password}
                    />
                    <label className="block">
                        <span className="mb-2 block text-sm font-black text-slate-700">
                            Type DELETE
                        </span>
                        <input
                            value={form.confirmation}
                            onChange={(event) =>
                                setForm({
                                    ...form,
                                    confirmation: event.target.value,
                                })
                            }
                            required
                            autoComplete="off"
                            className="h-12 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                        />
                        {errors.confirmation && (
                            <FieldError error={errors.confirmation} />
                        )}
                    </label>
                    {errors.detail && <FieldError error={errors.detail} />}
                </div>
                <div className="mt-6 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-11 flex-1 rounded-lg border border-slate-300 text-sm font-black text-slate-700 hover:bg-slate-50"
                    >
                        Keep account
                    </button>
                    <button
                        type="submit"
                        disabled={!canDelete || deleting}
                        className="h-11 flex-1 rounded-lg bg-rose-600 text-sm font-black text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {deleting ? "Deleting..." : "Delete forever"}
                    </button>
                </div>
            </form>
        </div>
    );
}

function StatusBadge({ order }) {
    const tone =
        order.status === "delivered"
            ? "bg-emerald-100 text-emerald-800"
            : order.status === "cancelled"
              ? "bg-rose-100 text-rose-700"
              : "bg-blue-100 text-blue-800";
    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${tone}`}
        >
            {order.status_display}
        </span>
    );
}

function FieldError({ error }) {
    const message = Array.isArray(error) ? error[0] : error;
    return (
        <p className="mt-1.5 text-xs font-bold text-rose-600">{message}</p>
    );
}

function AccountLoading() {
    return (
        <main className="min-h-screen bg-[#f6f7f9] px-4 pt-36 pb-12 md:pt-28">
            <div className="mx-auto max-w-6xl animate-pulse">
                <div className="h-8 w-56 rounded bg-slate-200" />
                <div className="mt-6 grid gap-6 lg:grid-cols-[250px_1fr]">
                    <div className="h-64 rounded-xl bg-white" />
                    <div className="h-[520px] rounded-xl bg-white" />
                </div>
            </div>
        </main>
    );
}

export default ProfilePage;
