// supabase/functions/send_push/index.ts

declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
  env: {
    get: (key: string) => string | undefined;
  };
};

Deno.serve(async (req: Request) => {
  const body = await req.json();

  // просто форвардим данные
  const res = await fetch(Deno.env.get("PUSH_SERVER_URL")!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Deno.env.get("PUSH_SERVER_SECRET")}`,
    },
    body: JSON.stringify(body),
  });

  return new Response(await res.text(), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
});
