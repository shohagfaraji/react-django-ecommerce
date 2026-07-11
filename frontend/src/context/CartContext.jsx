import { createContext, useContext, useEffect, useState } from "react";
import { authFetch, getAccessToken } from "../utils/auth";

const CartContext = createContext();

const calculateCartTotal = (items) =>
    items.reduce((sum, item) => {
        const unitPrice = item.product_discounted_price
            ? parseFloat(item.product_discounted_price)
            : parseFloat(item.product_price || 0);
        return sum + unitPrice * item.quantity;
    }, 0);

export const CartProvider = ({ children }) => {
    const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;
    const [cartItems, setCartItems] = useState([]);
    const [total, setTotal] = useState(0);

    const applyCartItems = (items) => {
        setCartItems(items);
        setTotal(calculateCartTotal(items));
    };

    const fetchCart = async () => {
        const token = getAccessToken();
        if (!token) return;

        try {
            const res = await authFetch(`${BASEURL}/api/cart/`);
            const data = await res.json();
            applyCartItems(data.items || []);
        } catch (error) {
            console.error("Error fetching cart:", error);
        }
    };

    useEffect(() => {
        void fetchCart();
    }, []);

    const addToCart = async (productId) => {
        const previousItems = cartItems;
        const existing = cartItems.find(
            (item) =>
                item.product === productId || item.product?.id === productId,
        );

        const nextItems = existing
            ? cartItems.map((item) =>
                  item.product === productId || item.product?.id === productId
                      ? { ...item, quantity: item.quantity + 1 }
                      : item,
              )
            : [
                  ...cartItems,
                  {
                      id: `temp-${productId}`,
                      product: productId,
                      quantity: 1,
                  },
              ];

        applyCartItems(nextItems);

        try {
            await authFetch(`${BASEURL}/api/cart/add/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ product_id: productId }),
            });
            void fetchCart();
        } catch (error) {
            console.error("Error adding to cart:", error);
            applyCartItems(previousItems);
            void fetchCart();
        }
    };

    const removeFromCart = async (itemId) => {
        const previousItems = cartItems;
        const nextItems = cartItems.filter((item) => item.id !== itemId);
        applyCartItems(nextItems);

        try {
            await authFetch(`${BASEURL}/api/cart/remove/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ item_id: itemId }),
            });
        } catch (error) {
            console.error("Error removing from cart:", error);
            applyCartItems(previousItems);
            void fetchCart();
        }
    };

    const updateQuantity = async (itemId, quantity) => {
        if (quantity < 1) {
            void removeFromCart(itemId);
            return;
        }

        const previousItems = cartItems;
        const nextItems = cartItems.map((item) =>
            item.id === itemId ? { ...item, quantity } : item,
        );
        applyCartItems(nextItems);

        try {
            await authFetch(`${BASEURL}/api/cart/update/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ item_id: itemId, quantity }),
            });
        } catch (error) {
            console.error("Error updating cart:", error);
            applyCartItems(previousItems);
            void fetchCart();
        }
    };

    const clearCart = () => {
        applyCartItems([]);
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
