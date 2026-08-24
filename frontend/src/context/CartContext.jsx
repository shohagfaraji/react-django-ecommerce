import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import CartContext from "./cartStore";
import { authFetch, CART_CACHE_KEY, getAccessToken } from "../utils/auth";
import {
    getCachedJson,
    getCachedProduct,
    preloadImage,
    setCachedJson,
} from "../utils/apiCache";

const QUANTITY_UPDATE_DELAY = 180;

const calculateCartTotal = (items) =>
    items.reduce((sum, item) => {
        const unitPrice = item.product_discounted_price
            ? parseFloat(item.product_discounted_price)
            : parseFloat(item.product_price || 0);
        return sum + unitPrice * item.quantity;
    }, 0);

const productIdFor = (item) => item.product?.id || item.product;
const isTemporaryItem = (itemId) => String(itemId).startsWith("temp-");

const responseError = async (response, fallback) => {
    try {
        const data = await response.json();
        return data.error || data.detail || fallback;
    } catch {
        return fallback;
    }
};

function getInitialCartItems() {
    if (!getAccessToken()) return [];
    const cached = getCachedJson(CART_CACHE_KEY);
    return Array.isArray(cached) ? cached : [];
}

export const CartProvider = ({ children }) => {
    const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;
    const [cartItems, setCartItems] = useState(getInitialCartItems);
    const [cartLoading, setCartLoading] = useState(
        () => Boolean(getAccessToken()) && !getCachedJson(CART_CACHE_KEY),
    );
    const cartItemsRef = useRef(cartItems);
    const pendingCartRequest = useRef(null);
    const quantityTimers = useRef(new Map());
    const pendingQuantityRequests = useRef(new Set());
    const cancelledTemporaryProducts = useRef(new Set());

    const applyCartItems = useCallback((items) => {
        cartItemsRef.current = items;
        setCartItems(items);
        setCachedJson(CART_CACHE_KEY, items);
        items.forEach((item) => preloadImage(item.product_image));
    }, []);

    const fetchCart = useCallback(async () => {
        if (!getAccessToken()) {
            applyCartItems([]);
            setCartLoading(false);
            return [];
        }
        if (pendingCartRequest.current) return pendingCartRequest.current;

        if (!cartItemsRef.current.length) setCartLoading(true);

        const request = authFetch(`${BASEURL}/api/cart/`)
            .then(async (response) => {
                if (!response.ok) throw new Error("Could not load your cart.");
                const data = await response.json();
                const items = data.items || [];
                applyCartItems(items);
                return items;
            })
            .catch((error) => {
                console.error("Error fetching cart:", error);
                if (!getAccessToken()) applyCartItems([]);
                return cartItemsRef.current;
            })
            .finally(() => {
                if (pendingCartRequest.current === request) {
                    pendingCartRequest.current = null;
                    setCartLoading(false);
                }
            });

        pendingCartRequest.current = request;
        return request;
    }, [BASEURL, applyCartItems]);

    const persistQuantity = useCallback(
        async (itemId, quantity) => {
            const operation = (async () => {
                try {
                    const response = await authFetch(
                        `${BASEURL}/api/cart/update/`,
                        {
                            method: "POST",
                            body: JSON.stringify({
                                item_id: itemId,
                                quantity,
                            }),
                        },
                    );
                    if (!response.ok) {
                        throw new Error(
                            await responseError(
                                response,
                                "Could not update this quantity.",
                            ),
                        );
                    }
                    const serverItem = await response.json();
                    const currentItem = cartItemsRef.current.find(
                        (item) => item.id === itemId,
                    );
                    if (currentItem?.quantity === quantity) {
                        applyCartItems(
                            cartItemsRef.current.map((item) =>
                                item.id === itemId ? serverItem : item,
                            ),
                        );
                    }
                } catch (error) {
                    console.error("Error updating cart:", error);
                    await fetchCart();
                }
            })();

            pendingQuantityRequests.current.add(operation);
            try {
                await operation;
            } finally {
                pendingQuantityRequests.current.delete(operation);
            }
        },
        [BASEURL, applyCartItems, fetchCart],
    );

    const flushCartUpdates = useCallback(async () => {
        const scheduledUpdates = [...quantityTimers.current.entries()];
        quantityTimers.current.clear();
        const scheduledRequests = scheduledUpdates.map(
            ([itemId, update]) => {
                window.clearTimeout(update.timer);
                return persistQuantity(itemId, update.quantity);
            },
        );
        await Promise.all([
            ...scheduledRequests,
            ...pendingQuantityRequests.current,
        ]);
    }, [persistQuantity]);

    const addToCart = useCallback(
        async (productId) => {
            const cachedProduct = getCachedProduct(productId);
            const currentItems = cartItemsRef.current;
            const existing = currentItems.find(
                (item) => productIdFor(item) === productId,
            );
            const nextQuantity = (existing?.quantity || 0) + 1;
            if (
                cachedProduct?.track_inventory &&
                nextQuantity > cachedProduct.stock_quantity
            ) {
                throw new Error(
                    cachedProduct.stock_quantity > 0
                        ? `Only ${cachedProduct.stock_quantity} units are available.`
                        : `${cachedProduct.name} is currently out of stock.`,
                );
            }
            const nextItems = existing
                ? currentItems.map((item) =>
                      item === existing
                          ? { ...item, quantity: item.quantity + 1 }
                          : item,
                  )
                : [
                      ...currentItems,
                      {
                          id: `temp-${productId}`,
                          product: productId,
                          quantity: 1,
                          product_name: cachedProduct?.name || "Product",
                          product_price: cachedProduct?.price || "0.00",
                          product_image: cachedProduct?.image_url || "",
                          product_active_discount:
                              cachedProduct?.active_discount || 0,
                          product_discounted_price:
                              cachedProduct?.discounted_price || null,
                          product_track_inventory:
                              cachedProduct?.track_inventory || false,
                          product_stock_quantity:
                              cachedProduct?.stock_quantity ?? 0,
                          product_is_in_stock:
                              cachedProduct?.is_in_stock ?? true,
                      },
                  ];

            cancelledTemporaryProducts.current.delete(productId);
            applyCartItems(nextItems);

            try {
                const response = await authFetch(`${BASEURL}/api/cart/add/`, {
                    method: "POST",
                    body: JSON.stringify({ product_id: productId }),
                });
                if (!response.ok) {
                    throw new Error(
                        await responseError(
                            response,
                            "Could not add this product.",
                        ),
                    );
                }
                const data = await response.json();

                if (cancelledTemporaryProducts.current.has(productId)) {
                    cancelledTemporaryProducts.current.delete(productId);
                    await authFetch(`${BASEURL}/api/cart/remove/`, {
                        method: "POST",
                        body: JSON.stringify({ item_id: data.item.id }),
                    });
                    return;
                }

                const currentItem = cartItemsRef.current.find(
                    (item) => productIdFor(item) === productId,
                );
                const desiredQuantity =
                    currentItem?.quantity || data.item.quantity;
                const serverItem = {
                    ...data.item,
                    quantity: desiredQuantity,
                };
                const hasCurrentItem = Boolean(currentItem);
                applyCartItems(
                    hasCurrentItem
                        ? cartItemsRef.current.map((item) =>
                              item === currentItem ? serverItem : item,
                          )
                        : [...cartItemsRef.current, serverItem],
                );

                if (desiredQuantity !== data.item.quantity) {
                    void persistQuantity(data.item.id, desiredQuantity);
                }
            } catch (error) {
                console.error("Error adding to cart:", error);
                await fetchCart();
                throw error;
            }
        },
        [BASEURL, applyCartItems, fetchCart, persistQuantity],
    );

    const removeFromCart = useCallback(
        async (itemId) => {
            const item = cartItemsRef.current.find(
                (cartItem) => cartItem.id === itemId,
            );
            const pendingUpdate = quantityTimers.current.get(itemId);
            if (pendingUpdate) window.clearTimeout(pendingUpdate.timer);
            quantityTimers.current.delete(itemId);
            applyCartItems(
                cartItemsRef.current.filter(
                    (cartItem) => cartItem.id !== itemId,
                ),
            );

            if (isTemporaryItem(itemId)) {
                if (item) {
                    cancelledTemporaryProducts.current.add(
                        productIdFor(item),
                    );
                }
                return;
            }

            try {
                const response = await authFetch(
                    `${BASEURL}/api/cart/remove/`,
                    {
                        method: "POST",
                        body: JSON.stringify({ item_id: itemId }),
                    },
                );
                if (!response.ok) {
                    throw new Error("Could not remove this product.");
                }
            } catch (error) {
                console.error("Error removing from cart:", error);
                await fetchCart();
            }
        },
        [BASEURL, applyCartItems, fetchCart],
    );

    const updateQuantity = useCallback(
        (itemId, quantity) => {
            if (quantity < 1) {
                void removeFromCart(itemId);
                return;
            }

            applyCartItems(
                cartItemsRef.current.map((item) =>
                    item.id === itemId ? { ...item, quantity } : item,
                ),
            );

            const currentUpdate = quantityTimers.current.get(itemId);
            if (currentUpdate) window.clearTimeout(currentUpdate.timer);
            if (isTemporaryItem(itemId)) return;

            const timer = window.setTimeout(() => {
                quantityTimers.current.delete(itemId);
                void persistQuantity(itemId, quantity);
            }, QUANTITY_UPDATE_DELAY);
            quantityTimers.current.set(itemId, { timer, quantity });
        },
        [applyCartItems, persistQuantity, removeFromCart],
    );

    const clearCart = useCallback(() => {
        quantityTimers.current.forEach((update) =>
            window.clearTimeout(update.timer),
        );
        quantityTimers.current.clear();
        cancelledTemporaryProducts.current.clear();
        applyCartItems([]);
    }, [applyCartItems]);

    useEffect(() => {
        void fetchCart();
        const timers = quantityTimers.current;
        return () => {
            timers.forEach((update) => window.clearTimeout(update.timer));
            timers.clear();
        };
    }, [fetchCart]);

    const total = useMemo(() => calculateCartTotal(cartItems), [cartItems]);
    const value = useMemo(
        () => ({
            cartItems,
            cartLoading,
            total,
            fetchCart,
            addToCart,
            removeFromCart,
            updateQuantity,
            flushCartUpdates,
            clearCart,
        }),
        [
            addToCart,
            cartItems,
            cartLoading,
            clearCart,
            fetchCart,
            flushCartUpdates,
            removeFromCart,
            total,
            updateQuantity,
        ],
    );

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
