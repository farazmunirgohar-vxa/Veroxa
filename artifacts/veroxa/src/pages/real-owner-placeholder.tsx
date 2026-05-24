import { RequireRole } from "@/components/auth/RequireRole";

export default function RealOwnerPlaceholder() {
  return (
    <RequireRole role="owner">
      {/* Future authenticated Owner Portal will render here. */}
      <></>
    </RequireRole>
  );
}
