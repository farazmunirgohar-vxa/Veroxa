import { RequireRole } from "@/components/auth/RequireRole";

export default function RealClientPlaceholder() {
  return (
    <RequireRole role="client">
      {/* Future authenticated Client Portal will render here. */}
      <></>
    </RequireRole>
  );
}
