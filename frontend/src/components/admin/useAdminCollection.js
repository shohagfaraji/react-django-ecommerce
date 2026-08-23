import { useCallback, useEffect, useState } from "react";
import { adminRequest } from "../../utils/admin";

function useAdminCollection(path, enabled) {
    const baseUrl = import.meta.env.VITE_DJANGO_BASE_URL;
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const result = await adminRequest(baseUrl, path);
            setData(result);
            setLoaded(true);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoading(false);
        }
    }, [baseUrl, path]);

    useEffect(() => {
        if (enabled && !loaded) void load();
    }, [enabled, load, loaded]);

    return { data, setData, loading, error, load };
}

export default useAdminCollection;
