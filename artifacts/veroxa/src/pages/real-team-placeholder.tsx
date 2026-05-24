import { RequireRole } from "@/components/auth/RequireRole";

export default function RealTeamPlaceholder() {
  return (
    <RequireRole role="team">
      {/* Future authenticated Team Portal will render here. */}
      <></>
    </RequireRole>
  );
}
