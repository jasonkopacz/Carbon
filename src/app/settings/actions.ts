"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "em_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export async function saveToken(formData: FormData) {
  const token = (formData.get("token") as string | null)?.trim() ?? "";
  const jar = await cookies();
  if (token) {
    jar.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
  } else {
    jar.delete(COOKIE_NAME);
  }
  redirect("/settings");
}
