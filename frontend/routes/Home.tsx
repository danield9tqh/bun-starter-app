import { App } from "backend/server";
import { hc } from "hono/client";
import { useState } from "react";

const client = hc<App>("/api");

export function Home() {
    const [name, setName] = useState("");
    const [response, setResponse] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleClick = async () => {
        setLoading(true);
        setResponse(null);

        try {
            const res = await client.hello.$post({
                json: { name },
            });

            if (!res.ok) {
                setResponse("Error: " + res.statusText);
            } else {
                const data = await res.json();
                setResponse(data.message);
            }
        } catch (error) {
            setResponse("Error: " + (error instanceof Error ? error.message : "Unknown error"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: "20px", maxWidth: "400px", margin: "0 auto" }}>
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                style={{
                    padding: "10px",
                    fontSize: "16px",
                    width: "100%",
                    marginBottom: "10px",
                }}
            />
            <button
                onClick={handleClick}
                disabled={loading || !name.trim()}
                style={{
                    padding: "10px 20px",
                    fontSize: "16px",
                    cursor: loading || !name.trim() ? "not-allowed" : "pointer",
                    width: "100%",
                }}
            >
                {loading ? "Sending..." : "Say Hello"}
            </button>
            {response && (
                <div style={{ marginTop: "20px", padding: "10px", backgroundColor: "#f0f0f0", borderRadius: "4px" }}>
                    {response}
                </div>
            )}
        </div>
    );
}

