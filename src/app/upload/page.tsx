import { redirect } from "next/navigation";

// The upload flow now requires building context.
// Redirect to the landing page where users can pick a building.
export default function UploadPage() {
  redirect("/");
}
