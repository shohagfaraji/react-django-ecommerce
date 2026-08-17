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
import useCart from "../context/useCart";
import {
    authFetch,
    cacheProfile,
    clearTokens,
    fetchOrders,
    fetchProfile,
    getCachedProfile,
    ORDERS_CACHE_KEY,
} from "../utils/auth";
import { getCachedJson } from "../utils/apiCache";
import { formatDate } from "../utils/orders";

const DEFAULT_AVATAR = "/default-avatar.svg";

function ProfilePage() {
    const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;
    const [searchParams, setSearchParams] = useSearchParams();
    const requestedSection = searchParams.get("section");
    const activeSection = ["orders", "security"].includes(requestedSection)
        ? requestedSection
        : "profile";
    const [profile, setProfile] = useState(() => getCachedProfile() || null);
    const [orders, setOrders] = useState(
        () => getCachedJson(ORDERS_CACHE_KEY) || [],
    );
    const [loading, setLoading] = useState(() => !getCachedProfile());
    const [ordersLoaded, setOrdersLoaded] = useState(
        () => getCachedJson(ORDERS_CACHE_KEY) !== undefined,
    );
    const [loadError, setLoadError] = useState("");
    const [ordersError, setOrdersError] = useState("");

    useEffect(() => {
        let active = true;

        const loadAccount = async () => {
            try {
                const profileData = await fetchProfile(BASEURL, {
                    force: Boolean(getCachedProfile()),
                });
                if (!active) return;
                setProfile(profileData);
            } catch (error) {
                if (!active) return;
                if (!getCachedProfile()) setProfile(null);
                setLoadError(error.message || "Could not load your account.");
            } finally {
                if (active) setLoading(false);
            }
        };
        void loadAccount();
        return () => {
            active = false;
        };
    }, [BASEURL]);

    useEffect(() => {
        if (activeSection !== "orders") return undefined;
        let active = true;

        const loadOrders = async () => {
            try {
                const orderData = await fetchOrders(BASEURL, {
                    force:
                        getCachedJson(ORDERS_CACHE_KEY) !== undefined,
                });
                if (!active) return;
                setOrders(orderData);
                setOrdersError("");
            } catch (error) {
                if (active) {
                    setOrdersError(
                        error.message || "Could not load your orders.",
                    );
                }
            } finally {
                if (active) setOrdersLoaded(true);
            }
        };

        void loadOrders();
        return () => {
            active = false;
        };
    }, [BASEURL, activeSection]);

    const handleProfileChanged = (nextProfile) => {
        cacheProfile(nextProfile);
        setProfile(nextProfile);
    };

    if (loading && !profile) return <AccountLoading />;
    if (loadError || !profile) {
        return (
            <main className="min-h-screen bg-[#f6f7f9] px-4 pt-36 pb-12 md:pt-28">
                <div className="mx-auto max-w-3xl rounded-xl border border-[#b62324]/25 bg-white p-8 text-center shadow-sm">
                    <h1 className="text-2xl font-black text-slate-950">
                        Your account could not be loaded
                    </h1>
                    <p className="mt-2 text-sm font-semibold text-[#b62324]">
                        {loadError}
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#f6f7f9] px-4 pt-36 pb-12 sm:px-6 md:pt-28 xl:px-8">
            <div className="mx-auto max-w-[1440px]">
                <div className="grid gap-7 xl:grid-cols-[300px_minmax(0,1fr)]">
                    <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <AccountSummary profile={profile} />
                        <nav className="mt-4 space-y-2" aria-label="Account">
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
                                <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-1 text-sm">
                                    {profile.order_count ?? orders.length}
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
                            onProfileChanged={handleProfileChanged}
                        />
                    )}
                    {activeSection === "orders" && (
                        <Orders
                            orders={orders}
                            loading={!ordersLoaded}
                            error={ordersError}
                        />
                    )}
                    {activeSection === "security" && <Security />}
                </div>
            </div>
        </main>
    );
}

function AccountSummary({ profile }) {
    return (
        <div className="flex items-center gap-4 border-b border-slate-100 px-2 pb-5">
            <img
                src={
                    profile.profile_picture_thumbnail_url ||
                    profile.profile_picture_url ||
                    DEFAULT_AVATAR
                }
                alt={`${profile.username}'s profile`}
                className="h-16 w-16 rounded-full border border-slate-200 object-cover"
                decoding="async"
            />
            <div className="min-w-0">
                <p className="truncate text-lg font-black text-slate-950">
                    {profile.name || profile.username}
                </p>
                <p className="mt-0.5 truncate text-sm font-semibold text-slate-500">
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
            className={`flex min-h-14 w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left text-base font-black transition ${
                active
                    ? "bg-emerald-50 text-emerald-800"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            }`}
        >
            <span className="text-lg">{icon}</span>
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
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9 lg:p-10">
            <h2 className="text-3xl font-black text-slate-950">
                Personal details
            </h2>
            <p className="mt-2 text-base leading-7 text-slate-500">
                Your phone and address start empty and can be added whenever
                you’re ready.
            </p>

            <form onSubmit={handleSubmit} className="mt-9">
                <div className="mb-9 flex flex-col items-center gap-6 rounded-2xl bg-slate-50 p-6 text-center sm:flex-row sm:text-left">
                    <div className="relative">
                        <img
                            src={preview}
                            alt="Profile preview"
                            className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-sm"
                            decoding="async"
                        />
                        <button
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            className="absolute right-0 bottom-0 flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-lg text-white shadow transition hover:bg-emerald-700"
                            aria-label="Change profile picture"
                        >
                            <FaCamera />
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
                        <p className="text-lg font-black text-slate-900">
                            Profile picture
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                            JPG, PNG, GIF or WebP. Maximum 5 MB.
                        </p>
                        {errors.profile_picture && (
                            <FieldError error={errors.profile_picture} />
                        )}
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
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

                <label className="mt-6 block">
                    <span className="mb-2.5 block text-base font-black text-slate-700">
                        Address
                    </span>
                    <div className="flex rounded-lg border border-slate-300 bg-white px-3 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
                        <FaMapMarkerAlt className="mt-4.5 shrink-0 text-lg text-slate-400" />
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
                            className="min-w-0 flex-1 resize-y px-4 py-3.5 text-base outline-none"
                        />
                    </div>
                    {errors.address && <FieldError error={errors.address} />}
                </label>

                {errors.detail && <FieldError error={errors.detail} />}

                <div className="mt-8 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex h-13 items-center justify-center gap-2.5 rounded-xl bg-slate-950 px-7 text-base font-black text-white transition hover:bg-emerald-700 disabled:opacity-60"
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
            <span className="mb-2.5 block text-base font-black text-slate-700">
                {label}
            </span>
            <div className="flex h-14 items-center rounded-xl border border-slate-300 bg-white px-4 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
                <span className="text-lg text-slate-400">{icon}</span>
                <input
                    type={type}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    required={required}
                    className="h-full min-w-0 flex-1 px-3.5 text-base outline-none"
                />
            </div>
            {error ? (
                <FieldError error={error} />
            ) : (
                help && (
                    <p
                        className={`mt-2 text-sm font-bold ${
                            tone === "available"
                                ? "text-emerald-700"
                                : tone === "taken" || tone === "invalid"
                                  ? "text-[#b62324]"
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

function Orders({ orders, loading, error }) {
    if (loading) return <OrdersLoading />;

    if (error && !orders.length) {
        return (
            <section className="rounded-2xl border border-[#b62324]/25 bg-white p-12 text-center shadow-sm">
                <FaExclamationTriangle className="mx-auto text-5xl text-[#b62324]" />
                <h2 className="mt-5 text-3xl font-black text-slate-950">
                    Your orders could not be loaded
                </h2>
                <p className="mt-2 text-base font-semibold text-[#b62324]">
                    {error}
                </p>
            </section>
        );
    }

    if (!orders.length) {
        return (
            <section className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                <FaBoxOpen className="mx-auto text-6xl text-slate-300" />
                <h2 className="mt-5 text-3xl font-black text-slate-950">
                    No orders yet
                </h2>
                <p className="mt-2 text-base text-slate-500">
                    Your completed checkouts will appear here.
                </p>
                <Link
                    to="/"
                    className="mt-6 inline-flex rounded-xl bg-slate-950 px-7 py-3.5 text-base font-black text-white hover:bg-emerald-700"
                >
                    Start shopping
                </Link>
            </section>
        );
    }

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10 lg:p-12">
            <h2 className="text-3xl font-black text-slate-950 sm:text-4xl">
                My orders
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-500 sm:text-lg">
                Orders are permanent records and cannot be removed individually.
            </p>
            <div className="mt-9 space-y-5">
                {orders.map((order) => (
                    <Link
                        key={order.id}
                        to={`/profile/orders/${order.id}`}
                        className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-5 rounded-2xl border border-slate-200 p-5 transition hover:border-emerald-300 hover:bg-emerald-50/40 hover:shadow-sm sm:grid-cols-[72px_minmax(0,1fr)_auto_24px] sm:gap-6 sm:p-7"
                    >
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-700 sm:h-18 sm:w-18">
                            <FaBoxOpen />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xl font-black text-slate-950 sm:text-2xl">
                                Order {order.customer_order_number}
                            </p>
                            <p className="mt-2 text-base font-semibold leading-6 text-slate-500">
                                {formatDate(order.created_at)} ·{" "}
                                {order.item_count}{" "}
                                {order.item_count === 1 ? "item" : "items"}
                            </p>
                        </div>
                        <div className="text-right">
                            <StatusBadge order={order} />
                            <p className="mt-2.5 text-xl font-black text-slate-950 sm:text-2xl">
                                ${Number(order.total_amount).toFixed(2)}
                            </p>
                        </div>
                        <FaChevronRight className="hidden text-xl text-slate-400 sm:block" />
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
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9 lg:p-10">
                <h2 className="text-3xl font-black text-slate-950">
                    Change password
                </h2>
                <form onSubmit={changePassword} className="mt-8 max-w-3xl space-y-6">
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
                        className="h-13 rounded-xl bg-slate-950 px-7 text-base font-black text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                        {saving ? "Updating..." : "Update password"}
                    </button>
                </form>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9 lg:p-10">
                <h2 className="text-2xl font-black text-slate-950">Session</h2>
                <p className="mt-2 text-base text-slate-500">
                    Sign out on this device when you’re finished.
                </p>
                <button
                    type="button"
                    onClick={logout}
                    className="mt-5 inline-flex h-13 items-center gap-2.5 rounded-xl border border-slate-300 px-6 text-base font-black text-slate-700 hover:bg-slate-50"
                >
                    <FaSignOutAlt />
                    Logout
                </button>
            </section>

            <section className="rounded-2xl border border-[#b62324]/25 bg-[#b62324]/10 p-6 shadow-sm sm:p-9 lg:p-10">
                <h2 className="flex items-center gap-3 text-2xl font-black text-[#b62324]">
                    <FaExclamationTriangle />
                    Delete account
                </h2>
                <p className="mt-3 max-w-3xl text-base leading-7 text-[#b62324]">
                    Permanently deletes your profile, every order and order
                    item, cart, and all other data connected to your account.
                    This cannot be undone.
                </p>
                <button
                    type="button"
                    onClick={() => setShowDelete(true)}
                    className="mt-5 inline-flex h-13 items-center gap-2.5 rounded-xl bg-[#b62324] px-6 text-base font-black text-white hover:bg-[#991f20]"
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
            <span className="mb-2.5 block text-base font-black text-slate-700">
                {label}
            </span>
            <div className="flex h-14 items-center rounded-xl border border-slate-300 bg-white px-4 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
                <FaKey className="text-lg text-slate-400" />
                <input
                    type="password"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    onBlur={onBlur}
                    required
                    className="h-full min-w-0 flex-1 px-3.5 text-base outline-none"
                />
            </div>
            {error ? (
                <FieldError error={error} />
            ) : (
                help && (
                    <p
                        className={`mt-2 text-sm font-bold ${
                            tone === "matched"
                                ? "text-emerald-700"
                                : tone === "mismatch"
                                  ? "text-[#b62324]"
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
                className="w-full max-w-lg rounded-2xl bg-white p-7 shadow-2xl sm:p-9"
            >
                <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#b62324]/15 text-xl text-[#b62324]">
                        <FaExclamationTriangle />
                    </div>
                    <h2
                        id="delete-account-title"
                        className="text-2xl font-black text-slate-950 sm:text-3xl"
                    >
                        This action is permanent
                    </h2>
                </div>
                <p className="mt-3 text-base leading-7 text-slate-600">
                    All profile data, orders, and cart history will be deleted.
                    Enter your password and type{" "}
                    <strong className="text-[#b62324]">DELETE</strong> to
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
                        <span className="mb-2.5 block text-base font-black text-slate-700">
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
                            className="h-14 w-full rounded-xl border border-slate-300 px-4 text-base outline-none focus:border-[#b62324] focus:ring-2 focus:ring-[#b62324]/15"
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
                        className="h-13 flex-1 rounded-xl border border-slate-300 text-base font-black text-slate-700 hover:bg-slate-50"
                    >
                        Keep account
                    </button>
                    <button
                        type="submit"
                        disabled={!canDelete || deleting}
                        className="h-13 flex-1 rounded-xl bg-[#b62324] text-base font-black text-white hover:bg-[#991f20] disabled:cursor-not-allowed disabled:opacity-50"
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
              ? "bg-[#b62324]/15 text-[#b62324]"
              : "bg-blue-100 text-blue-800";
    return (
        <span
            className={`inline-flex rounded-full px-3 py-1.5 text-sm font-black ${tone}`}
        >
            {order.status_display}
        </span>
    );
}

function FieldError({ error }) {
    const message = Array.isArray(error) ? error[0] : error;
    return (
        <p className="mt-2 text-sm font-bold text-[#b62324]">{message}</p>
    );
}

function AccountLoading() {
    return (
        <main className="min-h-screen bg-[#f6f7f9] px-4 pt-36 pb-12 md:pt-28">
            <div className="mx-auto max-w-[1440px] animate-pulse">
                <div className="h-8 w-56 rounded bg-slate-200" />
                <div className="mt-6 grid gap-7 xl:grid-cols-[300px_minmax(0,1fr)]">
                    <div className="h-64 rounded-xl bg-white" />
                    <div className="h-[520px] rounded-xl bg-white" />
                </div>
            </div>
        </main>
    );
}

function OrdersLoading() {
    return (
        <section className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10 lg:p-12">
            <div className="h-10 w-48 rounded bg-slate-200" />
            <div className="mt-4 h-6 w-80 max-w-full rounded bg-slate-100" />
            <div className="mt-9 space-y-5">
                {[1, 2, 3].map((item) => (
                    <div
                        key={item}
                        className="h-28 rounded-2xl bg-slate-100"
                    />
                ))}
            </div>
        </section>
    );
}

export default ProfilePage;
