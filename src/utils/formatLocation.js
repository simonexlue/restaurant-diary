export function formatLocation(address) {
    if(!address) return ""

    const parts = address.split(",")

    if(parts.length < 2) return address

    const street = parts[0].trim()
    const city = parts[1].trim();

    return `${street}, ${city}`
}