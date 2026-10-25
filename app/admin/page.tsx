import { redirect } from "next/navigation";

// The overview page arrives with statistics; until then, start in content.
export default function AdminHome() {
  redirect("/admin/innehall");
}
