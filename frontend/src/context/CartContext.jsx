import { createContext, useContext, useState, useEffect } from "react";
import { authFetch, getAccessToken } from "../utils/auth";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;
    const [cartItems, setCartItems] = useState([]);
    const [total, setTotal] = useState(0);

    //Fetch Cart from backend
    const fetchCart = async () => {
        const token = getAccessToken();
        if (!token) return;

        try {
            const res = await authFetch(`${BASEURL}/api/cart/`);
            const data = await res.json();
            setCartItems(data.items || []);
            setTotal(data.total || 0);
        } catch (error) {
            console.error("Error fetching cart:", error);
        }
    };

    useEffect(() => {
        fetchCart();
    }, []);

    const addToCart = async (productId) => {
        // Optimistic update — increment count immediately, no waiting
        setCartItems((prev) => {
            const existing = prev.find(
                (i) => i.product === productId || i.product?.id === productId,
            );
            if (existing) {
                return prev.map((i) =>
                    i.product === productId || i.product?.id === productId
                        ? { ...i, quantity: i.quantity + 1 }
                        : i,
                );
            }
            // New item placeholder so count updates instantly
            return [
                ...prev,
                { id: `temp-${productId}`, product: productId, quantity: 1 },
            ];
        });

        try {
            await authFetch(`${BASEURL}/api/cart/add/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ product_id: productId }),
            });
            // Sync real state from server after optimistic update
            fetchCart();
        } catch (error) {
            console.error("Error adding to cart:", error);
            fetchCart(); // Revert on error by re-syncing
        }
    };

    const removeFromCart = async (itemId) => {
        try {
            await authFetch(`${BASEURL}/api/cart/remove/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ item_id: itemId }),
            });
            fetchCart();
        } catch (error) {
            console.error("Error adding to cart:", error);
        }
    };

    const updateQuantity = async (itemId, quantity) => {
        if (quantity < 1) {
            await removeFromCart(itemId);
            return;
        }
        try {
            await authFetch(`${BASEURL}/api/cart/update/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ item_id: itemId, quantity }),
            });
            fetchCart();
        } catch (error) {
            console.error("Error adding to cart:", error);
        }
    };

    const clearCart = () => {
        setCartItems([]);
        setTotal(0);
    };

    return (
        <CartContext.Provider
            value={{
                cartItems,
                total,
                fetchCart,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
