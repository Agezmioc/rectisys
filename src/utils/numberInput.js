export const isValidNumberInput = (
    value,
    {
        decimals = 2,
        allowNegative = false
    } = {}
) => {
    if (value === "") {
        return true;
    }

    const sign = allowNegative ? "-?" : "";

    const regex = new RegExp(
        `^${sign}\\d*(\\.\\d{0,${decimals}})?$`
    );

    return regex.test(value);
};