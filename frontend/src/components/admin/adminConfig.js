export const ORDER_STATUSES = [
    ["placed", "Order placed"],
    ["confirmed", "Confirmed"],
    ["processing", "Processing"],
    ["shipped", "Shipped"],
    ["out_for_delivery", "Out for delivery"],
    ["delivered", "Delivered"],
    ["cancelled", "Cancelled"],
];

export const CATEGORY_SECTIONS = [
    ["clothing", "Clothing"],
    ["electronics", "Electronics"],
    ["toys", "Toys"],
    ["garden", "Garden"],
    ["home", "Home & Living"],
    ["beauty", "Beauty & Personal Care"],
    ["sports", "Sports & Outdoors"],
    ["other", "Other"],
];

export const money = (value) =>
    Number(value || 0).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
    });

export const formatDate = (value, includeTime = true) => {
    if (!value) return "—";
    return new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        ...(includeTime ? { timeStyle: "short" } : {}),
    }).format(new Date(value));
};

export const toDateTimeInput = (value) => {
    if (!value) return "";
    const date = new Date(value);
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
};
