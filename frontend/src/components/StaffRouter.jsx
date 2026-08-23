import { useEffect, useState } from "react";
import { Link, Navigate, Outlet } from "react-router-dom";
import { fetchProfile, getAccessToken, getCachedProfile } from "../utils/auth";

function StaffRouter() {
    const baseUrl = import.meta.env.VITE_DJANGO_BASE_URL;
    const cachedProfile = getCachedProfile();
    const [state, setState] = useState(() => ({
        loading:
            Boolean(getAccessToken()) &&
            typeof cachedProfile?.is_staff !== "boolean",
        profile: cachedProfile || null,
        error: "",
    }));

    useEffect(() => {
        if (!getAccessToken()) return;

        let active = true;
        fetchProfile(baseUrl, {
            force: typeof cachedProfile?.is_staff !== "boolean",
        })
            .then((profile) => {
                if (active) setState({ loading: false, profile, error: "" });
            })
            .catch(() => {
                if (active) {
                    setState({
                        loading: false,
                        profile: null,
                        error: "Your account could not be verified.",
                    });
                }
            });

        return () => {
            active = false;
        };
    }, [baseUrl, cachedProfile?.is_staff]);

    if (!getAccessToken()) return <Navigate to="/login" replace />;

    if (state.loading) {
        return (
            <main className="min-h-screen bg-slate-100 p-5 sm:p-8">
                <div className="mx-auto max-w-7xl animate-pulse space-y-5">
                    <div className="h-16 rounded-2xl bg-white" />
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {[0, 1, 2, 3].map((item) => (
                            <div
                                className="h-32 rounded-2xl bg-white"
                                key={item}
                            />
                        ))}
                    </div>
                    <div className="h-96 rounded-2xl bg-white" />
                </div>
            </main>
        );
    }

    if (!state.profile?.is_staff) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
                <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b62324]">
                        Access restricted
                    </p>
                    <h1 className="mt-3 text-2xl font-black text-slate-950">
                        Staff access is required
                    </h1>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                        {state.error ||
                            "This dashboard is available only to authorized staff accounts."}
                    </p>
                    <Link
                        to="/"
                        className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-emerald-700"
                    >
                        Return to store
                    </Link>
                </section>
            </main>
        );
    }

    return <Outlet context={{ staff: state.profile }} />;
}

export default StaffRouter;
