import { RequireRole } from "@/components/auth/RequireRole";

export default function RealOperatorPlaceholder() {
  return (
    <RequireRole role="operator">
      {/* Future authenticated Operator Portal will render here. */}
      <></>
    </RequireRole>
  );
}
