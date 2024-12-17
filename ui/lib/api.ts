export const submitMetadata = async (metadata: any) => {
    const response = await fetch("/api/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metadata),
    });
    return response.json();
};
