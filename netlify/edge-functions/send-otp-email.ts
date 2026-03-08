// deno-lint-ignore-file no-explicit-any

function toBase64Url(input: string): string {
    const b64 = btoa(input);
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function buildOtpMime(opts: {
    to: string;
    subject: string;
    appName: string;
    otp: string;
    ttlMinutes: number;
    fromName: string;
}): string {
    const body = [
        `Your ${opts.appName} verification code is: ${opts.otp}`,
        `This code expires in ${opts.ttlMinutes} minutes.`,
        "",
        "If you didn't request this, you can ignore this email.",
        "",
        `${opts.fromName}`,
    ].join("\n");

    return [
        `To: ${opts.to}`,
        `Subject: ${opts.subject}`,
        "Content-Type: text/plain; charset=UTF-8",
        "MIME-Version: 1.0",
        "",
        body,
    ].join("\n");
}

export default async (req: Request) => {
    if (req.method !== "POST") {
        return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
            status: 405,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        const PICA_SECRET_KEY = Deno.env.get("PICA_SECRET_KEY");
        const PICA_GMAIL_CONNECTION_KEY = Deno.env.get("PICA_GMAIL_CONNECTION_KEY");

        if (!PICA_SECRET_KEY) throw new Error("Missing env: PICA_SECRET_KEY");
        if (!PICA_GMAIL_CONNECTION_KEY) throw new Error("Missing env: PICA_GMAIL_CONNECTION_KEY");

        const input = (await req.json()) as {
            to?: string;
            otp: string;
            subject?: string;
            appName?: string;
            ttlMinutes?: number;
            fromName?: string;
        };

        const to = input.to ?? "krakenkk54@gmail.com";
        const otp = input.otp;
        const subject = input.subject ?? "Farewell Authentication Code";
        const appName = input.appName ?? "Farewell 2026 Admin";
        const ttlMinutes = input.ttlMinutes ?? 10;
        const fromName = input.fromName ?? "Support Team";

        if (!otp || typeof otp !== "string") {
            return new Response(JSON.stringify({ ok: false, error: "Field 'otp' is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const mime = buildOtpMime({ to, subject, appName, otp, ttlMinutes, fromName });
        const raw = toBase64Url(mime);

        const url = "https://api.picaos.com/v1/passthrough/users/me/messages/send";

        const resp = await fetch(url, {
            method: "POST",
            headers: {
                "x-pica-secret": PICA_SECRET_KEY,
                "x-pica-connection-key": PICA_GMAIL_CONNECTION_KEY,
                "x-pica-action-id": "conn_mod_def::F_JeJ_A_TKg::cc2kvVQQTiiIiLEDauy6zQ",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ raw }),
        });

        const data = await resp.json().catch(() => ({}));

        if (!resp.ok) {
            return new Response(JSON.stringify({ ok: false, status: resp.status, error: data }), {
                status: 502,
                headers: { "Content-Type": "application/json" },
            });
        }

        return new Response(
            JSON.stringify({ ok: true, id: data.id, threadId: data.threadId, gmail: data }),
            { status: 200, headers: { "Content-Type": "application/json" } },
        );
    } catch (err: any) {
        return new Response(JSON.stringify({ ok: false, error: err?.message ?? String(err) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};

export const config = { path: "/api/send-otp-email" };
