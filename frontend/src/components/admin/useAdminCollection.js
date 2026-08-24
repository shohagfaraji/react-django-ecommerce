import { useCallback, useEffect, useRef, useState } from "react";
import {
    cacheAdminData,
    fetchAdminData,
    getCachedAdminData,
} from "../../utils/admin";

function useAdminCollection(path, enabled) {
    const baseUrl = import.meta.env.VITE_DJANGO_BASE_URL;
    const initialData = useRef(getCachedAdminData(path));
    const [data, setDataState] = useState(() => initialData.current || []);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const requested = useRef(false);

    const load = useCallback(async () => {
        if (getCachedAdminData(path) === undefined) setLoading(true);
        setError("");
        try {
            const result = await fetchAdminData(baseUrl, path);
            setDataState(result);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoading(false);
        }
    }, [baseUrl, path]);

    useEffect(() => {
        if (!enabled || requested.current) return;
        requested.current = true;
        void load();
    }, [enabled, load]);

    const setData = useCallback(
        (value) => {
            setDataState((current) => {
                const next =
                    typeof value === "function" ? value(current) : value;
                cacheAdminData(path, next);
                return next;
            });
        },
        [path],
    );

    return { data, setData, loading, error, load };
}

export default useAdminCollection;
