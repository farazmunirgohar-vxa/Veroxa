export function momoCanonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(momoCanonicalJson).join(",")}]`;
  }
  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) =>
      `${JSON.stringify(key)}:${momoCanonicalJson(record[key])}`
    ).join(",")}}`;
  }
  const serialized = JSON.stringify(value);
  if (serialized === undefined) {
    throw new Error("non_json_value");
  }
  return serialized;
}
