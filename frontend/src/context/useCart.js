import { useContext } from "react";
import CartContext from "./cartStore";

export default function useCart() {
    return useContext(CartContext);
}
