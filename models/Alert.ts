export default interface Alert {
    type: "primary" | "secondary" | "success" | "danger" | "warning" | "info" | "light" | "dark",
    // blue | gray | green | red | yellow | light blue | white | black
    message: string,
}