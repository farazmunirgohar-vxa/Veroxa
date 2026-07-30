"use client";

/* Signed private Blob URLs cannot use the Next image optimizer. */
/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useRef, useState } from "react";
import type { MomoWorkspaceData } from "./momo-data";
import {
  MOMO_IMAGE_PRESETS,
  buildMomoImageEditPlan,
  deriveMomoCenterCoverCrop,
  deriveMomoCoverCropAtFocalPoint,
  type MomoImagePresetKey,
} from "./momo-media-workflow";
import { inspectMomoImageBlob, renderMomoImageEdit } from "./momo-image-renderer";
import {
  MOMO_PUBLIC_SEO_EVIDENCE,
  closeMomoMediaAiAttempt,
  getMomoMediaAiRuntimeStatus,
  getMomoTeamMediaSource,
  generateMomoMediaAiCandidate,
  loadMomoTeamPreconnectionData,
  momoBlobSha256,
  approveMomoMediaAiCandidate,
  persistMomoImageRendition,
  persistMomoAiContractRehearsal,
  persistMomoMetricsRehearsalSuite,
  persistMomoPublicationRehearsalSuite,
  persistMomoSeoWorkspace,
  requestMomoActionConsent,
  rejectMomoMediaAiCandidate,
  runMomoPreconnectionGate,
  type MomoActionKind,
  type MomoMediaAiRuntimeStatus,
  type MomoTeamPreconnectionData,
} from "./momo-team-preconnection-data";
import {
  MOMO_MEDIA_AI_AUTHORIZATION_THRESHOLD_MICROUSD,
  MOMO_MEDIA_AI_AUTOMATIC_PRESET,
  MOMO_MEDIA_AI_AUTOMATIC_GOAL,
  MOMO_MEDIA_AI_AUTOMATIC_QUALITY,
  MOMO_MEDIA_AI_GOALS,
  MOMO_MEDIA_AI_MAX_SOURCE_BYTES,
  MOMO_MEDIA_AI_PRESETS,
  MOMO_MEDIA_AI_PROCESSING_ATTESTATION,
  MOMO_MEDIA_AI_RESERVATION_MICROUSD,
  momoMediaAiAccountingLabel,
  momoMediaAiAutomaticAttemptScope,
  momoMediaAiErrorMessage,
  momoMediaAiInspectionAllowsApproval,
} from "./momo-media-ai-contract";
import { analyzeMomoSeoEvidence, buildMomoSeoChangePlan } from "./momo-seo-workbench";
import { MOMO_GROWTH_EVIDENCE } from "./momo-growth-evidence";
import { momoRenditionMatchesCurrentEvidence, resolveMomoMediaWorkflow } from "./momo-media-guidance";

type Props = {
  mode: "media" | "publication" | "seo" | "readiness";
  restaurantId: string;
  workspace?: MomoWorkspaceData;
  preferredAssetId?: string;
  onPreferredAssetChange?: (assetId: string) => void;
  onWorkspaceRefresh?: () => Promise<void>;
};

const EMPTY: MomoTeamPreconnectionData = {
  runtimeControls: [], renditions: [], publicationRehearsals: [], seoBaselines: [], seoChangeSets: [], gateRuns: [],
  actionConsents: [], trackingContracts: [], releaseAttestations: [], aiRehearsals: [], metricsRehearsals: [],
  mediaAiCandidates: [],
};

const titleCase = (value: string) => value.replace(/[._-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const formatDate = (value: string | null | undefined) => value ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Not recorded";
const jsonArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const mediaAiDollars = (microusd: number) => `$${(microusd / 1_000_000).toFixed(2)}`;

function Badge({ value }: { value: string }) {
  return <span className={`status-badge ${value}`}>{titleCase(value)}</span>;
}

function canvasBlob(canvas: HTMLCanvasElement, type = "image/png", quality = 1): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("fixture_encode_failed")), type, quality));
}

async function syntheticSource(): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 1200;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("fixture_canvas_unavailable");
  const gradient = context.createLinearGradient(0, 0, 1600, 1200);
  gradient.addColorStop(0, "#efe6d8");
  gradient.addColorStop(1, "#b94a37");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 1600, 1200);
  context.fillStyle = "#fff8ef";
  context.beginPath();
  context.arc(800, 610, 370, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#7d2e25";
  context.font = "700 88px system-ui";
  context.textAlign = "center";
  context.fillText("MOMO WORKFLOW TEST", 800, 575);
  context.font = "44px system-ui";
  context.fillText("Synthetic · Team-only · No public use", 800, 660);
  return canvasBlob(canvas);
}

async function persistMomoSyntheticChannelFixtures(restaurantId: string): Promise<void> {
  const sourceBlob = await syntheticSource();
  const sourceContentSha256 = await momoBlobSha256(sourceBlob);
  const fixtures: Array<{ preset: MomoImagePresetKey; format: "image/jpeg"; altText: string }> = [
    { preset: "facebook_feed", format: "image/jpeg", altText: "Synthetic Momo Facebook workflow card used only for Team preconnection testing." },
    { preset: "instagram_portrait", format: "image/jpeg", altText: "Synthetic Momo Instagram workflow card used only for Team preconnection testing." },
    { preset: "google_business_square", format: "image/jpeg", altText: "Synthetic Momo Google Business workflow card used only for Team preconnection testing." },
  ];
  for (const fixture of fixtures) {
    const outputPreset = MOMO_IMAGE_PRESETS[fixture.preset];
    const plan = await buildMomoImageEditPlan({
      restaurantId, assetId: "synthetic-fixture-v1", sourceKind: "synthetic_fixture",
      mimeType: sourceBlob.type, width: 1600, height: 1200, contentSha256: sourceContentSha256,
      rightsStatus: "synthetic", reviewStatus: "synthetic", publicUseApproved: false,
      usageScope: [], evidenceClass: "synthetic",
    }, {
      preset: fixture.preset, outputFormat: fixture.format, quality: 0.9,
      brightness: 100, contrast: 100, saturation: 100, rotation: 0,
      crop: deriveMomoCenterCoverCrop({
        sourceWidth: 1600, sourceHeight: 1200,
        outputWidth: outputPreset.width, outputHeight: outputPreset.height, rotation: 0,
      }),
      altText: fixture.altText,
    });
    const output = await renderMomoImageEdit(sourceBlob, plan);
    await persistMomoImageRendition({
      restaurantId, sourceKind: "synthetic_fixture", sourceAssetId: null,
      sourceKey: "synthetic-fixture-v1", sourceContentSha256,
      sourceWidth: 1600, sourceHeight: 1200, plan, output, evidenceClass: "synthetic",
    });
  }
}

async function persistMomoCompleteFreeRehearsalSuite(restaurantId: string): Promise<void> {
  await persistMomoSyntheticChannelFixtures(restaurantId);
  await persistMomoAiContractRehearsal(restaurantId);
  await persistMomoMetricsRehearsalSuite(restaurantId);
  await persistMomoSeoWorkspace(restaurantId);
  const refreshed = await loadMomoTeamPreconnectionData(restaurantId);
  await persistMomoPublicationRehearsalSuite(restaurantId, refreshed.renditions);
  await runMomoPreconnectionGate(restaurantId);
}

export function MomoTeamPreconnectionCenter({ mode, restaurantId, workspace, preferredAssetId, onPreferredAssetChange, onWorkspaceRefresh }: Props) {
  const [data, setData] = useState<MomoTeamPreconnectionData>(EMPTY);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [dataObservedAtMs, setDataObservedAtMs] = useState(0);

  const refresh = async () => {
    const next = await loadMomoTeamPreconnectionData(restaurantId);
    setData(next);
    setDataObservedAtMs(Date.now());
    setState("ready");
  };

  useEffect(() => {
    let active = true;
    void loadMomoTeamPreconnectionData(restaurantId)
      .then((next) => {
        if (active) {
          setData(next);
          setDataObservedAtMs(Date.now());
          setState("ready");
        }
      })
      .catch(() => { if (active) setState("error"); });
    return () => { active = false; };
  }, [restaurantId]);

  const run = async (
    action: () => Promise<void>,
    success: string,
    options: { refreshAfterSuccess?: boolean } = {},
  ) => {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      await action();
      if (options.refreshAfterSuccess !== false) await refresh();
      setMessage(success);
    } catch (error) {
      const code = error instanceof Error && /^[a-z0-9_]{3,80}$/.test(error.message)
        ? error.message
        : "";
      const stage = code
        ? titleCase(code)
        : "Unknown Internal Stage";
      setMessage(code.includes("media_ai") || code.startsWith("provider_") || code.startsWith("candidate_") || code === "source_not_ready" || code === "idempotency_conflict"
        ? momoMediaAiErrorMessage(code)
        : `The Team rehearsal was not saved. No external action occurred. Team-only stage: ${stage}.`);
    } finally {
      setBusy(false);
    }
  };

  if (state === "loading") return <section className="momo-panel"><p>Loading Team-only preconnection evidence…</p></section>;
  if (state === "error") return <section className="momo-panel"><p className="momo-warning">Preconnection records are unavailable until the protected database migration is active.</p></section>;
  return <>
    {mode === "media" && <MomoTeamImageEditor key={preferredAssetId || workspace?.media[0]?.id || "no-real-media"} restaurantId={restaurantId} workspace={workspace} preferredAssetId={preferredAssetId} onPreferredAssetChange={onPreferredAssetChange} onWorkspaceRefresh={onWorkspaceRefresh} refreshData={refresh} dataObservedAtMs={dataObservedAtMs} data={data} busy={busy} run={run} />}
    {mode === "publication" && <MomoPublicationRehearsal restaurantId={restaurantId} data={data} busy={busy} run={run} />}
    {mode === "seo" && <MomoSeoWorkbench restaurantId={restaurantId} data={data} busy={busy} run={run} />}
    {mode === "readiness" && <><MomoAutomationContract restaurantId={restaurantId} data={data} busy={busy} run={run} /><MomoPreconnectionGate restaurantId={restaurantId} data={data} busy={busy} run={run} /></>}
    {message && <p className="momo-callout" role="status" aria-live="polite">{message}</p>}
  </>;
}

function MomoTeamImageEditor({
  restaurantId, workspace, preferredAssetId, onPreferredAssetChange, onWorkspaceRefresh, refreshData, dataObservedAtMs, data, busy, run,
}: {
  restaurantId: string;
  workspace?: MomoWorkspaceData;
  preferredAssetId?: string;
  onPreferredAssetChange?: (assetId: string) => void;
  onWorkspaceRefresh?: () => Promise<void>;
  refreshData: () => Promise<void>;
  dataObservedAtMs: number;
  data: MomoTeamPreconnectionData;
  busy: boolean;
  run: (
    action: () => Promise<void>,
    success: string,
    options?: { refreshAfterSuccess?: boolean },
  ) => Promise<void>;
}) {
  const editableAssets = (workspace?.media || []).filter((asset) => /^image\/(jpeg|png|webp)$/.test(asset.mime_type));
  const [sourceAssetId, setSourceAssetId] = useState(() => preferredAssetId || editableAssets[0]?.id || "");
  const [preset, setPreset] = useState<MomoImagePresetKey>("instagram_portrait");
  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(0);
  const [brightness, setBrightness] = useState(103);
  const [contrast, setContrast] = useState(105);
  const [saturation, setSaturation] = useState(105);
  const [focalX, setFocalX] = useState(50);
  const [focalY, setFocalY] = useState(50);
  const [format, setFormat] = useState<"image/jpeg" | "image/png" | "image/webp">("image/jpeg");
  const [quality, setQuality] = useState(0.9);
  const [altText, setAltText] = useState("Momo’s House food image prepared for private review.");
  const [aiRetryNonce, setAiRetryNonce] = useState(0);
  const automaticAttemptedKeys = useRef(new Set<string>());
  const [aiReadbackRequired, setAiReadbackRequired] = useState(false);
  const [mediaAiRuntime, setMediaAiRuntime] = useState<{
    state: "checking" | "ready" | "unavailable";
    value: MomoMediaAiRuntimeStatus | null;
  }>({ state: "checking", value: null });
  const [renderedAiCandidateToken, setRenderedAiCandidateToken] = useState("");
  const [aiInspection, setAiInspection] = useState({
    candidateToken: "",
    confirmed: false,
    notes: "",
  });
  const selectedAsset = editableAssets.find((asset) => asset.id === sourceAssetId);
  const selectedRights = selectedAsset ? workspace?.mediaRights.find((item) => item.asset_id === selectedAsset.id) : null;
  const selectedReview = selectedAsset ? workspace?.mediaReviews.find((item) => item.asset_id === selectedAsset.id && item.is_current) : null;
  const selectedUsageScope = jsonArray(selectedRights?.usage_scope).filter((item): item is string => typeof item === "string");
  const previousRendition = selectedAsset
    ? data.renditions.find((item) => item.source_asset_id === selectedAsset.id && item.status === "ready")
    : undefined;
  const currentRendition = selectedAsset
    ? data.renditions.find((item) => momoRenditionMatchesCurrentEvidence({
      assetId: selectedAsset.id,
      assetContentSha256: selectedAsset.content_sha256 || "",
      rightsEvidenceClass: selectedRights?.evidence_class,
      usageScope: selectedUsageScope,
      sourceKind: item.source_kind,
      sourceAssetId: item.source_asset_id,
      sourceKey: item.source_key,
      sourceContentSha256: item.source_content_sha256,
      intendedUse: item.intended_use,
      renditionEvidenceClass: item.evidence_class,
      renditionStatus: item.status,
      externalWriteAllowed: item.external_write_allowed,
    }))
    : undefined;
  const visibleRendition = currentRendition || previousRendition;
  const selectedAiCandidates = selectedAsset
    ? data.mediaAiCandidates.filter((item) => item.source_asset_id === selectedAsset.id)
    : [];
  const matchingAutomaticAttempt = selectedAsset && selectedReview
    ? selectedAiCandidates.find((item) =>
      item.source_content_sha256 === selectedAsset.content_sha256
      && item.review_id === selectedReview.id
      && item.goal === MOMO_MEDIA_AI_AUTOMATIC_GOAL
      && item.preset_key === MOMO_MEDIA_AI_AUTOMATIC_PRESET)
    : undefined;
  const pendingAiCandidate = selectedAiCandidates.find((item) => item.status === "pending_review");
  const providerRunningAiCandidate = selectedAiCandidates.find((item) => item.status === "provider_running");
  const reservedAiCandidate = selectedAiCandidates.find((item) => item.status === "reserved");
  const activeAiCandidate = pendingAiCandidate
    || providerRunningAiCandidate
    || reservedAiCandidate;
  const providerRunningMayClose = Boolean(
    providerRunningAiCandidate?.provider_started_at
    && Date.parse(providerRunningAiCandidate.provider_started_at)
      <= dataObservedAtMs - 10 * 60 * 1000,
  );
  const candidatePreviewToken = pendingAiCandidate?.storage_path
    && pendingAiCandidate.storage_object_version
    && pendingAiCandidate.content_sha256
    ? [
      pendingAiCandidate.id,
      pendingAiCandidate.storage_path,
      pendingAiCandidate.storage_object_version,
      pendingAiCandidate.content_sha256,
    ].join(":")
    : "";
  const aiCandidateRendered = Boolean(
    candidatePreviewToken
    && renderedAiCandidateToken === candidatePreviewToken,
  );
  const aiInspectionConfirmed = aiInspection.candidateToken === candidatePreviewToken
    && aiInspection.confirmed;
  const aiInspectionNotes = aiInspection.candidateToken === candidatePreviewToken
    ? aiInspection.notes
    : "";
  const aiApprovalReady = momoMediaAiInspectionAllowsApproval({
    candidateToken: candidatePreviewToken,
    renderedToken: renderedAiCandidateToken,
    inspectionToken: aiInspection.candidateToken,
    inspectionConfirmed: aiInspection.confirmed,
    inspectionNotes: aiInspection.notes,
  });
  const mediaAiCommittedMicrousd = data.mediaAiCandidates.reduce(
    (total, item) => total + (
      typeof item.accounted_microusd === "number"
        ? item.accounted_microusd
        : item.status === "reserved" || item.status === "provider_running"
          ? item.reserved_microusd
          : 0
    ),
    0,
  );
  const [renderedRenditionId, setRenderedRenditionId] = useState("");
  const selectedWorkflow = resolveMomoMediaWorkflow({
    hasAsset: Boolean(selectedAsset),
    assetStatus: selectedAsset?.status,
    rightsStatus: selectedRights?.rights_status,
    rightsValidFrom: selectedRights?.valid_from,
    rightsExpiresAt: selectedRights?.expires_at,
    reviewStatus: selectedReview?.status,
    publicUseApproved: selectedReview?.public_use_approved,
    renditionStatus: currentRendition && renderedRenditionId === currentRendition.id ? currentRendition.status : undefined,
  });
  const synthetic = sourceAssetId === "synthetic-fixture-v1";
  const selectedPresetUse = MOMO_IMAGE_PRESETS[preset].intendedUse;
  const scopeAllowsPreset = synthetic || selectedUsageScope.includes(selectedPresetUse);
  const automaticPresetUse =
    MOMO_MEDIA_AI_PRESETS[MOMO_MEDIA_AI_AUTOMATIC_PRESET].intendedUse;
  const scopeAllowsAutomaticPreset =
    selectedUsageScope.includes(automaticPresetUse);
  const showEditor = synthetic || selectedWorkflow.reviewApproved;
  const canRender = synthetic || (selectedWorkflow.reviewApproved && scopeAllowsPreset);
  const mediaAiDatabaseEnabled = Boolean(data.runtimeControls[0]?.ai_live_calls);
  useEffect(() => {
    let active = true;
    void getMomoMediaAiRuntimeStatus()
      .then((value) => {
        if (active) setMediaAiRuntime({ state: "ready", value });
      })
      .catch(() => {
        if (active) setMediaAiRuntime({ state: "unavailable", value: null });
      });
    return () => { active = false; };
  }, [restaurantId, mediaAiDatabaseEnabled]);
  const mediaAiPreflightReady = mediaAiDatabaseEnabled
    && mediaAiRuntime.state === "ready"
    && mediaAiRuntime.value?.preflightReady === true;
  const sourceFitsMediaAi = Boolean(
    selectedAsset
    && selectedAsset.file_size > 0
    && selectedAsset.file_size <= MOMO_MEDIA_AI_MAX_SOURCE_BYTES,
  );
  const automaticProfileWithinAuthorization =
    MOMO_MEDIA_AI_RESERVATION_MICROUSD.high
      <= MOMO_MEDIA_AI_AUTHORIZATION_THRESHOLD_MICROUSD;
  const selectedAssetContentSha256 = selectedAsset?.content_sha256 || "";
  const automaticAttemptScope = selectedAsset && selectedReview
    ? momoMediaAiAutomaticAttemptScope({
      assetId: selectedAsset.id,
      reviewId: selectedReview.id,
      sourceContentSha256: selectedAssetContentSha256,
      retryNonce: aiRetryNonce,
    })
    : null;
  const automaticIdempotencyKey =
    automaticAttemptScope?.idempotencyKey || "";
  const canStartAutomaticAi = Boolean(
    !synthetic
    && selectedAsset
    && selectedWorkflow.reviewApproved
    && scopeAllowsAutomaticPreset
    && sourceFitsMediaAi
    && mediaAiPreflightReady
    && !busy
    && !activeAiCandidate
    && (!matchingAutomaticAttempt || aiRetryNonce > 0)
    && !aiReadbackRequired
    && automaticProfileWithinAuthorization
    && automaticIdempotencyKey,
  );

  const resetAiRequest = () => {
    setAiRetryNonce(0);
    setAiInspection({
      candidateToken: "",
      confirmed: false,
      notes: "",
    });
    setRenderedAiCandidateToken("");
  };

  const createRendition = async () => {
    const asset = synthetic ? null : editableAssets.find((item) => item.id === sourceAssetId);
    if (!synthetic && !asset) throw new Error("source_asset_required");
    const sourceBlob = synthetic ? await syntheticSource() : await getMomoTeamMediaSource(asset!.storage_path);
    const sourceInspection = await inspectMomoImageBlob(sourceBlob);
    const width = sourceInspection.width;
    const height = sourceInspection.height;
    const sourceContentSha256 = await momoBlobSha256(sourceBlob);
    const rights = asset ? workspace?.mediaRights.find((item) => item.asset_id === asset.id) : null;
    const review = asset ? workspace?.mediaReviews.find((item) => item.asset_id === asset.id && item.is_current) : null;
    const evidenceClass = synthetic ? "synthetic" as const : rights?.evidence_class === "real_owner" ? "real_owner" as const : "development_proxy" as const;
    const outputPreset = MOMO_IMAGE_PRESETS[preset];
    const plan = await buildMomoImageEditPlan({
      restaurantId,
      assetId: synthetic ? "synthetic-fixture-v1" : asset!.id,
      sourceKind: synthetic ? "synthetic_fixture" : "owner_asset",
      mimeType: sourceInspection.mimeType,
      width,
      height,
      contentSha256: sourceContentSha256,
      rightsStatus: synthetic ? "synthetic_fixture" : rights?.rights_status || "missing",
      reviewStatus: synthetic ? "synthetic_fixture" : review?.status || "missing",
      publicUseApproved: synthetic ? false : Boolean(review?.public_use_approved),
      usageScope: synthetic ? [] : jsonArray(rights?.usage_scope).filter((item): item is string => typeof item === "string"),
      evidenceClass,
    }, {
      preset,
      crop: deriveMomoCoverCropAtFocalPoint({
        sourceWidth: width, sourceHeight: height,
        outputWidth: outputPreset.width, outputHeight: outputPreset.height, rotation,
      }, focalX / 100, focalY / 100),
      rotation,
      brightness,
      contrast,
      saturation,
      outputFormat: format,
      quality,
      altText,
    });
    const output = await renderMomoImageEdit(sourceBlob, plan);
    await persistMomoImageRendition({
      restaurantId,
      sourceKind: synthetic ? "synthetic_fixture" : "owner_asset",
      sourceAssetId: asset?.id || null,
      sourceKey: synthetic ? "synthetic-fixture-v1" : asset!.id,
      sourceContentSha256,
      sourceWidth: width,
      sourceHeight: height,
      plan,
      output,
      evidenceClass,
    });
    if (asset) await onWorkspaceRefresh?.();
  };

  const approveAiCandidate = async () => {
    if (
      !pendingAiCandidate?.content_sha256
      || !aiApprovalReady
    ) throw new Error("invalid_momo_media_ai_approval");
    await approveMomoMediaAiCandidate({
      candidateId: pendingAiCandidate.id,
      contentSha256: pendingAiCandidate.content_sha256,
      inspectionNotes: aiInspectionNotes.trim(),
    });
    resetAiRequest();
    await onWorkspaceRefresh?.();
  };

  const rejectAiCandidate = async () => {
    if (
      !pendingAiCandidate?.content_sha256
      || aiInspectionNotes.trim().length < 10
    ) throw new Error("invalid_momo_media_ai_rejection");
    await rejectMomoMediaAiCandidate({
      candidateId: pendingAiCandidate.id,
      contentSha256: pendingAiCandidate.content_sha256,
      inspectionNotes: aiInspectionNotes.trim(),
    });
    resetAiRequest();
  };

  const closeAiAttempt = async () => {
    const candidate = reservedAiCandidate || (
      providerRunningMayClose ? providerRunningAiCandidate : undefined
    );
    if (!candidate) throw new Error("momo_media_ai_attempt_not_closeable");
    await closeMomoMediaAiAttempt(candidate.id);
    resetAiRequest();
  };

  useEffect(() => {
    if (
      !canStartAutomaticAi
      || !automaticIdempotencyKey
      || automaticAttemptedKeys.current.has(automaticIdempotencyKey)
    ) return;
    const startAutomaticAiCandidate = async () => {
      if (!selectedAsset) throw new Error("source_not_ready");
      setAiReadbackRequired(true);
      try {
        await generateMomoMediaAiCandidate({
          restaurantId,
          assetId: selectedAsset.id,
          goal: MOMO_MEDIA_AI_AUTOMATIC_GOAL,
          preset: MOMO_MEDIA_AI_AUTOMATIC_PRESET,
          quality: MOMO_MEDIA_AI_AUTOMATIC_QUALITY,
          altText: "Momo’s House food image prepared as a private high-fidelity AI candidate.",
          idempotencyKey: automaticIdempotencyKey,
          standingAutomation: true,
        });
      } catch (error) {
        try {
          await refreshData();
          setAiReadbackRequired(false);
        } catch {
          throw new Error("media_ai_readback_required");
        }
        throw error;
      }
      try {
        await refreshData();
      } catch {
        throw new Error("media_ai_readback_required");
      }
      setAiReadbackRequired(false);
      setAiInspection({
        candidateToken: "",
        confirmed: false,
        notes: "",
      });
      setRenderedAiCandidateToken("");
    };
    automaticAttemptedKeys.current.add(automaticIdempotencyKey);
    void run(
      startAutomaticAiCandidate,
      "Standing Momo automation created and verified one high-fidelity private AI candidate. Open and inspect it before deciding whether it may become Ready.",
      { refreshAfterSuccess: false },
    );
  }, [
    automaticIdempotencyKey,
    canStartAutomaticAi,
    refreshData,
    restaurantId,
    selectedAsset,
    run,
  ]);

  return <section id="momo-team-image-editor" className="momo-panel momo-form momo-guided-editor">
    <div className="momo-panel-heading"><div><p className="eyebrow">STEP 3 · PREPARE</p><h2>Create a private channel-sized version</h2><small>The newest real image is selected automatically. Ready means technically verified and available for visual review—not posted.</small></div><Badge value={selectedWorkflow.ready ? "ready" : canRender ? "available" : "blocked"} /></div>
    <div className="momo-media-journey team-media-journey" aria-label="Team media workflow"><ol><li className={selectedWorkflow.uploaded ? "done" : "current"}><b>1</b><span><strong>Uploaded</strong><small>Private original</small></span></li><li className={selectedWorkflow.reviewApproved ? "done" : selectedWorkflow.uploaded ? "current" : ""}><b>2</b><span><strong>Team review</strong><small>{selectedWorkflow.reviewApproved ? "Review approved" : "Required first"}</small></span></li><li className={selectedWorkflow.improvementReady ? "done" : selectedWorkflow.reviewApproved ? "current" : ""}><b>3</b><span><strong>Prepare</strong><small>{selectedWorkflow.improvementReady ? "Rendered and opened" : "Size and appearance"}</small></span></li><li className={selectedWorkflow.ready ? "done" : ""}><b>4</b><span><strong>Ready</strong><small>{selectedWorkflow.ready ? "Compare below" : "After verification"}</small></span></li></ol><em>Team only · no posting</em></div>
    {selectedRights && <p className="momo-form-note">Evidence class: <strong>{titleCase(selectedRights.evidence_class || "unknown")}</strong>{selectedRights.evidence_class === "development_proxy" ? " · rehearsal evidence only; this does not prove owner onboarding readiness" : ""}.</p>}
    {editableAssets.length === 0 ? <p className="momo-warning">No supported real image is available. Ask the Client to upload a JPG, PNG, or WebP image first.</p> : <>
      <label>Real source image<select value={sourceAssetId} onChange={(event) => { const next = event.target.value; resetAiRequest(); setSourceAssetId(next); if (next !== "synthetic-fixture-v1") onPreferredAssetChange?.(next); }}>{editableAssets.map((asset) => <option key={asset.id} value={asset.id}>{asset.original_file_name || asset.storage_path.split("/").at(-1)}</option>)}{synthetic && <option value="synthetic-fixture-v1">Built-in synthetic test card</option>}</select></label>
      {selectedAsset && <div className="momo-editor-preview-grid"><TeamPrivateImagePreview key={selectedAsset.storage_path} storagePath={selectedAsset.storage_path} alt={`Private original ${selectedAsset.original_file_name || "Momo image"}`} label="Original · unchanged" />{visibleRendition ? <TeamPrivateImagePreview key={visibleRendition.storage_path} storagePath={visibleRendition.storage_path} alt={visibleRendition.alt_text} label={`${selectedWorkflow.ready ? "Ready for private review" : "Previous private version · not currently Ready"} · ${visibleRendition.width}×${visibleRendition.height}`} expectedContentSha256={visibleRendition.content_sha256} renditionId={currentRendition?.id === visibleRendition.id ? currentRendition.id : undefined} setRenderedRenditionId={currentRendition?.id === visibleRendition.id ? setRenderedRenditionId : undefined} /> : <div className="momo-editor-preview-empty"><strong>Prepared version</strong><span>{selectedWorkflow.reviewApproved ? "Choose the output below, then render privately." : "Complete Team review first."}</span></div>}</div>}
    </>}
    {!synthetic && selectedAsset && !selectedWorkflow.reviewApproved && <div className="momo-editor-blocker" role="status"><strong>Review unlocks improvement</strong><p>{!selectedWorkflow.rightsConfirmed ? "This image does not have a confirmed rights record, so Veroxa must fail closed." : "In Step 2 above, record the quality review and approve public-use preparation. That permission does not post or connect any account."}</p><a href={`#momo-media-${selectedAsset.id}`}>Go to this image’s review</a></div>}
    {!synthetic && selectedWorkflow.reviewApproved && !scopeAllowsPreset && <div className="momo-editor-blocker" role="status"><strong>This output is outside the permitted uses</strong><p>The owner’s current rights do not include {titleCase(selectedPresetUse)}. Choose an allowed output preset or obtain a new rights record; Veroxa will not render it.</p></div>}
    {showEditor && <>
      <div className="momo-form-grid momo-editor-essentials"><label>Output preset<select value={preset} onChange={(event) => { const next = event.target.value as MomoImagePresetKey; setPreset(next); if (next === "google_business_square" && format === "image/webp") setFormat("image/jpeg"); }}>{Object.entries(MOMO_IMAGE_PRESETS).map(([key, item]) => <option key={key} value={key}>{item.label} · {item.width}×{item.height}</option>)}</select></label><label className="wide">Accessible description<textarea value={altText} maxLength={280} rows={2} onChange={(event) => setAltText(event.target.value)} /></label></div>
      <details className="momo-operations-details momo-editor-advanced"><summary><span><strong>Advanced image settings</strong><small>Focal position, orientation, appearance, format, and compression.</small></span><b>Optional</b></summary><div className="momo-form-grid"><label>Horizontal focal point<input type="range" min={0} max={100} value={focalX} onChange={(event) => setFocalX(Number(event.target.value))} /><small>{focalX < 34 ? "Left" : focalX > 66 ? "Right" : "Center"}</small></label><label>Vertical focal point<input type="range" min={0} max={100} value={focalY} onChange={(event) => setFocalY(Number(event.target.value))} /><small>{focalY < 34 ? "Top" : focalY > 66 ? "Bottom" : "Center"}</small></label><label>Rotation<select value={rotation} onChange={(event) => setRotation(Number(event.target.value) as 0 | 90 | 180 | 270)}><option value={0}>0°</option><option value={90}>90°</option><option value={180}>180°</option><option value={270}>270°</option></select></label><label>Format<select value={format} onChange={(event) => setFormat(event.target.value as typeof format)}><option value="image/webp" disabled={preset === "google_business_square"}>WebP</option><option value="image/jpeg">JPEG</option><option value="image/png">PNG</option></select></label><label>Brightness<input type="range" min={80} max={120} value={brightness} onChange={(event) => setBrightness(Number(event.target.value))} /><small>{brightness}%</small></label><label>Contrast<input type="range" min={80} max={120} value={contrast} onChange={(event) => setContrast(Number(event.target.value))} /><small>{contrast}%</small></label><label>Saturation<input type="range" min={75} max={125} value={saturation} onChange={(event) => setSaturation(Number(event.target.value))} /><small>{saturation}%</small></label><label>Quality<input type="range" min={0.5} max={1} step={0.01} value={quality} onChange={(event) => setQuality(Number(event.target.value))} /><small>{Math.round(quality * 100)}%</small></label></div></details>
      <p className="momo-form-note">The original is never changed. The derivative keeps an exact recipe, dimensions, source/output hashes, lineage, alt text, and private storage path.</p>
      <button className="primary-button momo-render-button" disabled={busy || !altText.trim() || !canRender} onClick={() => void run(createRendition, "Private channel-sized version rendered, technically verified, and linked to its unchanged original. Compare both versions before any later use.")}>{busy ? "Rendering and verifying…" : "Create private prepared version"}</button>
    </>}
    {!synthetic && selectedAsset && <section className="momo-media-ai-pilot" aria-labelledby="momo-media-ai-title">
      <div className="momo-panel-heading"><div><p className="eyebrow">STANDING AUTOMATION · PRIVATE CANDIDATE</p><h3 id="momo-media-ai-title">High-fidelity food finishing</h3><small>When this Team workspace observes a rights-current, approved Momo image, it starts one fixed server-side OpenAI edit automatically. The original remains unchanged; retries, Ready approval, and publishing are never automatic.</small></div><Badge value={pendingAiCandidate ? "review_required" : mediaAiRuntime.state === "checking" ? "checking" : mediaAiPreflightReady ? "preflight_ready" : "blocked"} /></div>
      <div className="momo-media-ai-budget"><span>Automatic authorization<strong>up to {mediaAiDollars(MOMO_MEDIA_AI_AUTHORIZATION_THRESHOLD_MICROUSD)} per job</strong></span><small>{mediaAiDollars(mediaAiCommittedMicrousd)} recorded across the loaded operational window: every active attempt plus the 25 newest terminal attempts. Each high-fidelity attempt reserves up to the per-job threshold. Completed requests use OpenAI’s returned usage when available; otherwise they retain the conservative authorization hold; an individual job requiring more than $20 stops and asks Faraz before OpenAI is called. This release has no batch runner.</small></div>
      {!mediaAiDatabaseEnabled && <p className="momo-warning">The database control for Media AI is not active. No provider call or charge can occur; the free manual editor remains available.</p>}
      {mediaAiDatabaseEnabled && mediaAiRuntime.state === "checking" && <p className="momo-form-note">Checking the protected server credential, Team-bound lifecycle bridge, and <code>gpt-image-2</code> model metadata before an eligible attempt may start…</p>}
      {mediaAiDatabaseEnabled && mediaAiRuntime.state === "unavailable" && <p className="momo-warning">The protected server runtime could not be verified. No provider call or charge can occur until that check succeeds.</p>}
      {mediaAiDatabaseEnabled && mediaAiRuntime.state === "ready" && !mediaAiRuntime.value?.preflightReady && <p className="momo-warning">The database control is active, but the protected credential, Team-bound lifecycle bridge, or <code>gpt-image-2</code> metadata check did not pass. No image request or charge can occur.</p>}
      {mediaAiPreflightReady && <p className="momo-form-note">Server preflight passed. This proves configuration, Team-bound lifecycle authority, and model metadata visibility—not Images Edit entitlement. The first eligible provider response remains the fail-closed entitlement proof.</p>}
      {!sourceFitsMediaAi && <p className="momo-warning">This source is larger than Media AI’s 20 MB private-processing limit. The free manual editor remains available; upload a current image at or below 20 MB to use AI.</p>}
      {selectedWorkflow.reviewApproved && !scopeAllowsAutomaticPreset && <p className="momo-warning">Standing AI uses the fixed {titleCase(automaticPresetUse)} portrait output, which is not included in the current rights scope. No paid request will start. Changing the free manual editor preset does not change the AI output; any future additional AI format will require an explicit action.</p>}
      {aiReadbackRequired && <p className="momo-warning">Authoritative AI attempt history is unavailable. The original request key is preserved and new paid requests are blocked; refresh this Team workspace before continuing.</p>}
      {reservedAiCandidate && <div className="momo-editor-blocker" role="status"><strong>Unused reservation can be closed</strong><p>The provider boundary was not crossed and $0 is accounted. Close this interrupted reservation before starting a fresh request.</p><button type="button" disabled={busy} onClick={() => void run(closeAiAttempt, "The unused reservation was closed at $0 accounted. A fresh request may now be created.")}>Close unused reservation</button></div>}
      {providerRunningAiCandidate && <div className="momo-editor-blocker" role="status"><strong>Provider boundary already crossed</strong><p>Veroxa will never send this exact request twice. {providerRunningMayClose ? "Its 10-minute safety window has elapsed; close it as uncertain and conservatively account the full reservation." : "Wait up to 10 minutes, then refresh. If no final result appears, the attempt can be closed without retrying the provider."}</p>{providerRunningMayClose && <button type="button" disabled={busy} onClick={() => void run(closeAiAttempt, "The uncertain attempt was closed, fully accounted, and will never be retried.")}>Close uncertain attempt</button>}</div>}
      {pendingAiCandidate?.storage_path && pendingAiCandidate.content_sha256 && candidatePreviewToken ? <>
        <div className="momo-editor-preview-grid momo-media-ai-comparison">
          <TeamPrivateImagePreview storagePath={selectedAsset.storage_path} alt={`Private original ${selectedAsset.original_file_name || "Momo image"}`} label="Original · unchanged" />
          <TeamPrivateImagePreview key={candidatePreviewToken} storagePath={pendingAiCandidate.storage_path} alt={pendingAiCandidate.alt_text} label={`AI candidate · ${pendingAiCandidate.output_width}×${pendingAiCandidate.output_height} · not Ready`} expectedContentSha256={pendingAiCandidate.content_sha256} previewToken={candidatePreviewToken} setRenderedPreviewToken={setRenderedAiCandidateToken} />
        </div>
        <div className="momo-media-ai-review">
          <p className="momo-form-note">{aiCandidateRendered ? "The exact private candidate decoded and its SHA-256 matched the database record." : "Open the exact private candidate successfully before approval unlocks."}</p>
          <label className="wide">Inspection notes<textarea value={aiInspectionNotes} minLength={10} maxLength={1000} rows={3} onChange={(event) => setAiInspection({ candidateToken: candidatePreviewToken, confirmed: aiInspectionConfirmed, notes: event.target.value })} placeholder="What stayed faithful, and what did you inspect closely?" /></label>
          <label className="momo-check"><input type="checkbox" checked={aiInspectionConfirmed} disabled={!aiCandidateRendered} onChange={(event) => setAiInspection({ candidateToken: candidatePreviewToken, confirmed: event.target.checked, notes: aiInspectionNotes })} /><span>I inspected the decoded candidate and verified it does not invent food, portions, ingredients, text, or claims.</span></label>
          <div className="momo-decision">
            <button className="primary-button" disabled={busy || !aiApprovalReady} onClick={() => void run(approveAiCandidate, "The inspected AI candidate is now a private Ready rendition. It was not posted or sent to any restaurant account.")}>{busy ? "Saving decision…" : "Approve candidate as Ready"}</button>
            <button type="button" disabled={busy || aiInspectionNotes.trim().length < 10} onClick={() => void run(rejectAiCandidate, "The AI candidate was rejected and remains unavailable to the Client. Nothing was published.")}>Reject candidate</button>
          </div>
        </div>
      </> : <div className="momo-media-ai-controls">
        <p className="momo-form-note">Automatic profile: {MOMO_MEDIA_AI_GOALS[MOMO_MEDIA_AI_AUTOMATIC_GOAL].label} at high fidelity. Fixed output: {MOMO_MEDIA_AI_PRESETS[MOMO_MEDIA_AI_AUTOMATIC_PRESET].width}×{MOMO_MEDIA_AI_PRESETS[MOMO_MEDIA_AI_AUTOMATIC_PRESET].height} PNG for {titleCase(MOMO_MEDIA_AI_PRESETS[MOMO_MEDIA_AI_AUTOMATIC_PRESET].intendedUse)}. The free manual editor preset does not change this paid request. The prompt is fixed by Veroxa; free-form instructions are never sent.</p>
        <p className="momo-form-note">{MOMO_MEDIA_AI_PROCESSING_ATTESTATION} The portal starts at most one automatic attempt for this exact asset and review. Any future additional AI format requires a separate explicit action; this release does not automate one.</p>
        {canStartAutomaticAi && <p className="momo-form-note" role="status">This eligible image is entering the standing automation now. The provider will never be retried automatically.</p>}
        {matchingAutomaticAttempt?.status === "failed" && !activeAiCandidate && <button type="button" className="secondary-button" disabled={busy || aiReadbackRequired} onClick={() => {
          setAiRetryNonce((value) => value + 1);
        }}>Authorize one manual retry</button>}
      </div>}
      {selectedAiCandidates.length > 0 && <details className="momo-operations-details"><summary><span><strong>AI attempt history</strong><small>Usage-aware accounting and private review state.</small></span><b>{selectedAiCandidates.length}</b></summary><div className="momo-record-list">{selectedAiCandidates.slice(0, 8).map((item) => <article key={item.id}><div><strong>{MOMO_MEDIA_AI_GOALS[item.goal].label} · {titleCase(item.quality)}</strong><p>{momoMediaAiAccountingLabel({ reservedMicrousd: item.reserved_microusd, accountedMicrousd: item.accounted_microusd, accountingBasis: item.accounting_basis })} · {item.output_width}×{item.output_height}</p><small>{formatDate(item.requested_at)} · no external write</small></div><Badge value={item.status} /></article>)}</div></details>}
    </section>}
    <details className="momo-operations-details momo-editor-technical"><summary><span><strong>Technical rehearsal tools</strong><small>Synthetic fixtures for Team-only contract testing.</small></span><b>Advanced</b></summary><div className="momo-decision"><button type="button" disabled={busy} onClick={() => { resetAiRequest(); setSourceAssetId("synthetic-fixture-v1"); setAltText("Synthetic Momo workflow test card used only to validate the image editor."); }}>Select synthetic test card</button><button type="button" disabled={busy} onClick={() => void run(() => persistMomoSyntheticChannelFixtures(restaurantId), "Facebook, Instagram, and Google synthetic media fixtures were rendered and stored privately.")}>Render all 3 synthetic fixtures</button></div></details>
    {data.renditions.length > 0 && <details className="momo-operations-details"><summary><span><strong>Rendition history</strong><small>Private outputs with immutable technical evidence.</small></span><b>{data.renditions.length}</b></summary><div className="momo-record-list">{data.renditions.slice(0, 6).map((item) => <article key={item.id}><div><strong>{titleCase(item.intended_use)} · {item.width}×{item.height}</strong><p>{item.alt_text}</p><small>{item.source_kind} · recipe {item.recipe_fingerprint.slice(0, 12)}… · output {item.content_sha256.slice(0, 12)}… · {formatDate(item.created_at)}</small></div><Badge value={item.external_write_allowed ? "invalid" : item.status} /></article>)}</div></details>}
  </section>;
}

function TeamPrivateImagePreview({
  storagePath,
  alt,
  label,
  expectedContentSha256,
  renditionId,
  setRenderedRenditionId,
  previewToken,
  setRenderedPreviewToken,
}: {
  storagePath: string;
  alt: string;
  label: string;
  expectedContentSha256?: string;
  renditionId?: string;
  setRenderedRenditionId?: (id: string) => void;
  previewToken?: string;
  setRenderedPreviewToken?: (token: string) => void;
}) {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;
    let objectUrl = "";
    void getMomoTeamMediaSource(storagePath)
      .then(async (blob) => {
        if (!active) return;
        if (expectedContentSha256 && await momoBlobSha256(blob) !== expectedContentSha256) {
          throw new Error("private_preview_hash_mismatch");
        }
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (active) {
          setState("error");
          setRenderedRenditionId?.("");
          setRenderedPreviewToken?.("");
        }
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [expectedContentSha256, setRenderedPreviewToken, setRenderedRenditionId, storagePath]);

  return <figure className="momo-editor-preview"><figcaption>{label}</figcaption>{state === "error" ? <span>Private preview unavailable</span> : !url ? <span>Opening private preview…</span> : <img src={url} alt={alt} onLoad={() => { setState("ready"); if (renditionId) setRenderedRenditionId?.(renditionId); if (previewToken) setRenderedPreviewToken?.(previewToken); }} onError={() => { setState("error"); setRenderedRenditionId?.(""); setRenderedPreviewToken?.(""); }} />}</figure>;
}

function MomoPublicationRehearsal({ restaurantId, data, busy, run }: { restaurantId: string; data: MomoTeamPreconnectionData; busy: boolean; run: (action: () => Promise<void>, success: string) => Promise<void> }) {
  const channels = ["facebook", "instagram", "google_business"];
  const scenarios = ["success", "transient_then_success", "permanent_failure"];
  const suiteComplete = channels.every((channel) => scenarios.every((scenario) => data.publicationRehearsals.some((item) => item.channel === channel && item.scenario === scenario)));
  const channelMediaReady = channels.every((channel) => data.renditions.some((item) => item.source_kind === "synthetic_fixture" && item.intended_use === channel && item.status === "ready"));
  return <section className="momo-panel">
    <div className="momo-panel-heading"><div><p className="eyebrow">TEAM-ONLY PUBLICATION CONTRACT</p><h2>Provider-disconnected rehearsal</h2></div><Badge value={suiteComplete ? "verified" : "not_tested"} /></div>
    <p>A deterministic adapter builds immutable payload and media snapshots, exercises success, bounded retry, terminal failure, and a PII-screened UTM mapping. It contains no network-call path, account token, external ID, published state, or read-back claim.</p>
    <button className="secondary-button" disabled={busy || !channelMediaReady} onClick={() => void run(() => persistMomoPublicationRehearsalSuite(restaurantId, data.renditions), "All nine channel/scenario publication rehearsals were persisted. No provider was contacted.")}>Run 3-channel success + retry + dead-letter matrix</button>{!channelMediaReady && <p className="momo-warning">Render the three private synthetic channel fixtures in Media before running this matrix.</p>}
    {data.publicationRehearsals.length === 0 ? <p className="momo-warning">No durable publication rehearsal exists yet.</p> : <div className="momo-record-list">{data.publicationRehearsals.map((item) => <article key={item.id}><div><strong>{titleCase(item.channel)} · {titleCase(item.scenario)}</strong><p>{jsonArray(item.attempts).length} attempt record(s) · payload {item.payload_sha256.slice(0, 12)}…</p><small>{formatDate(item.created_at)} · external writes locked</small></div><Badge value={item.status} /></article>)}</div>}
    <small>{data.trackingContracts.length} PII-screened tracking contract(s) · source mappings remain rehearsal-only</small>
  </section>;
}

function MomoAutomationContract({ restaurantId, data, busy, run }: { restaurantId: string; data: MomoTeamPreconnectionData; busy: boolean; run: (action: () => Promise<void>, success: string) => Promise<void> }) {
  const aiReady = data.aiRehearsals.some((item) => item.status === "completed" && !item.provider_called && !item.external_write_allowed && item.human_review_required);
  const metricSources = new Set(data.metricsRehearsals.map((item) => item.source));
  const metricsReady = (["facebook", "instagram", "google_business", "website"] as const)
    .every((source) => metricSources.has(source));
  return <section className="momo-panel">
    <div className="momo-panel-heading"><div><p className="eyebrow">AI + AUTOMATION · TEAM ONLY</p><h2>Provider-disconnected control contracts</h2></div><Badge value={aiReady && metricsReady ? "verified" : "not_tested"} /></div>
    <p>The AI rehearsal validates structured output, grounding, provenance, unsupported-claim blocking, human review, and all three channel variants without calling a model. Metrics fixtures validate source-specific fields, deduplication, missing-versus-zero handling, safe rates, and no cross-channel reach, causality, or ROI claim.</p>
    <div className="momo-decision"><button disabled={busy} onClick={() => void run(() => persistMomoAiContractRehearsal(restaurantId), "The offline AI output contract was persisted with grounding and human-review evidence. No model was called.")}>Run offline AI contract</button><button disabled={busy} onClick={() => void run(() => persistMomoMetricsRehearsalSuite(restaurantId), "Four source-specific metrics contracts were persisted as synthetic evidence.")}>Run metrics contract suite</button></div>
    <button className="secondary-button" disabled={busy} onClick={() => void run(() => persistMomoCompleteFreeRehearsalSuite(restaurantId), "The complete free Momo rehearsal suite ran: private media, AI contract, metrics, SEO, publishing failure matrix, tracking, and the preconnection gate. No provider was contacted and nothing was published.")}>{busy ? "Running free readiness suite…" : "Run all free Momo readiness rehearsals"}</button>
    <small>{data.aiRehearsals.length} offline AI contract rehearsal(s) · {metricSources.size}/4 metrics sources · publishing and all external writes remain locked; Media AI automation is reviewed in Media</small>
  </section>;
}

function MomoSeoWorkbench({ restaurantId, data, busy, run }: { restaurantId: string; data: MomoTeamPreconnectionData; busy: boolean; run: (action: () => Promise<void>, success: string) => Promise<void> }) {
  const findings = useMemo(() => analyzeMomoSeoEvidence(MOMO_PUBLIC_SEO_EVIDENCE), []);
  const [planPreview, setPlanPreview] = useState<{ title: string; description: string } | null>(null);
  const preview = async () => {
    const plan = await buildMomoSeoChangePlan({ pages: MOMO_PUBLIC_SEO_EVIDENCE, evidenceClass: "public_evidence", restaurantName: "Momo House", locality: "San Antonio", cuisine: "Nepali-Style Dumplings", address: "4447 De Zavala Rd" });
    setPlanPreview({ title: plan.changes[0].after, description: plan.changes[1].after });
  };
  return <section className="momo-panel">
    <div className="momo-panel-heading"><div><p className="eyebrow">TEAM-ONLY SEO WORKBENCH</p><h2>Public evidence → reversible plan</h2></div><Badge value={data.seoChangeSets.length ? "draft_ready" : "not_recorded"} /></div>
    <p className="momo-form-note">Observed public pages are evidence, not owner truth. The plan can be drafted and tested now; applying it remains blocked until owner confirmation, approval, website access, and external-write authorization exist.</p>
    <div className="momo-record-list">{findings.map((finding) => <article key={finding.code}><div><strong>{finding.title}</strong><p>{finding.evidence}</p><small><a href={finding.evidenceUrl} target="_blank" rel="noreferrer">Open public evidence</a> · {finding.recommendedAction}</small></div><Badge value={finding.severity} /></article>)}</div>
    <div className="momo-decision"><button disabled={busy} onClick={() => void preview()}>Preview safe metadata</button><button className="secondary-button" disabled={busy} onClick={() => void run(() => persistMomoSeoWorkspace(restaurantId), "Public SEO baseline, findings, reversible draft, and rollback snapshot were persisted. No website was changed.")}>Save baseline + change plan</button></div>
    {planPreview && <div className="momo-callout"><strong>Draft title</strong><p>{planPreview.title}</p><strong>Draft description</strong><p>{planPreview.description}</p></div>}
    <small>{data.seoBaselines.length} baseline(s) · {data.seoChangeSets.length} change plan(s) · every live write blocked</small>
    <details className="momo-operations-details"><summary><span><strong>Official growth evidence registry</strong><small>Google, Meta, FTC, W3C, and U.S. Copyright Office requirements used by this Momo build.</small></span><b>{MOMO_GROWTH_EVIDENCE.length} sources</b></summary><div className="momo-record-list">{MOMO_GROWTH_EVIDENCE.map((source) => <article key={source.key}><div><strong>{source.title}</strong><p>{source.productRequirement}</p><small><a href={source.url} target="_blank" rel="noreferrer">{source.publisher}</a> · retrieved {source.retrievedOn} · {source.guardrails.join(" · ")}</small></div><Badge value={source.area} /></article>)}</div></details>
  </section>;
}

function MomoPreconnectionGate({ restaurantId, data, busy, run }: { restaurantId: string; data: MomoTeamPreconnectionData; busy: boolean; run: (action: () => Promise<void>, success: string) => Promise<void> }) {
  const latest = data.gateRuns[0];
  const controls = data.runtimeControls[0];
  const externalWritesLocked = controls && !controls.provider_writes && !controls.review_replies && !controls.website_writes && !controls.external_scheduling;
  const [actionKind, setActionKind] = useState<MomoActionKind>("access_connection");
  const [subjectKey, setSubjectKey] = useState("momo_google_manager_access_v1");
  const [description, setDescription] = useState("Allow Veroxa's separate manager account to connect to the Momo House Google Business Profile. No password is shared and no profile change is included.");
  const [target, setTarget] = useState("Momo House Google Business Profile");
  const [operation, setOperation] = useState("Add Veroxa as a separate manager");
  const [currentValue, setCurrentValue] = useState("");
  const [proposedValue, setProposedValue] = useState("");
  const [scopeDetail, setScopeDetail] = useState("Manager access only; no listing edit, post, or review reply is included.");
  const requestConsent = async () => {
    const scope = actionKind === "business_profile_change"
      ? { target, operation, before: currentValue, after: proposedValue, batchSize: 1 }
      : actionKind === "access_connection"
        ? { target, operation, batchSize: 1 }
        : { target, operation, contentPreview: scopeDetail, batchSize: 1 };
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await requestMomoActionConsent({ restaurantId, actionKind, subjectKey, description, scope, expiresAt });
  };
  return <section className="momo-panel">
    <div className="momo-panel-heading"><div><p className="eyebrow">PRECONNECTION GATE · TEAM ONLY</p><h2>{latest?.status === "pass" ? "Ready to request owner access" : "Preconnection evidence still blocked"}</h2></div><Badge value={latest?.status || "not_evaluated"} /></div>
    <p>This is separate from production activation. It may pass with Meta, Google, website access, and live AI disconnected. Passing means only that Veroxa’s internal Momo workflows are ready for an owner access conversation.</p>
    <div className="momo-facts"><span>External actions<strong>{externalWritesLocked ? "All locked" : "Invalid"}</strong></span><span>Media AI automation<strong>{controls?.ai_live_calls ? "Active" : "Locked"}</strong></span><span>Release attestations<strong>{data.releaseAttestations.length}</strong></span><span>Image derivatives<strong>{data.renditions.length}</strong></span><span>Publication rehearsals<strong>{data.publicationRehearsals.length}</strong></span><span>SEO plans<strong>{data.seoChangeSets.length}</strong></span></div>
    <button className="secondary-button" disabled={busy} onClick={() => void run(async () => { await runMomoPreconnectionGate(restaurantId); }, "A new Team-only preconnection snapshot was recorded. Production activation remains false.")}>Evaluate preconnection gate</button>
    {latest && <><div className={latest.status === "pass" ? "momo-callout" : "momo-warning"}><strong>{latest.status === "pass" ? "Preconnection pass" : "Blocked"}</strong><p>{latest.status === "pass" ? "Internal workflows are ready for a scoped owner access request. No account is connected and nothing is activated." : `${latest.blockers.length} required check(s) remain: ${latest.blockers.map(titleCase).join(", ")}.`}</p><small>Evaluated {formatDate(latest.evaluated_at)} · activation: false</small></div><div className="momo-record-list">{Object.entries(latest.checks).map(([key, passed]) => <article key={key}><div><strong>{titleCase(key)}</strong></div><Badge value={passed ? "verified" : "blocked"} /></article>)}</div></>}
    <details className="momo-operations-details"><summary><span><strong>Exact owner action request</strong><small>Prepared for the future verified owner. The temporary development proxy cannot see or decide these requests.</small></span><b>{data.actionConsents.length} records</b></summary><div className="momo-form-grid"><label>Action<select value={actionKind} onChange={(event) => setActionKind(event.target.value as MomoActionKind)}><option value="access_connection">Access connection</option><option value="business_profile_change">Business profile change</option><option value="google_post">Google post</option><option value="social_post">Social post</option><option value="review_reply">Review reply</option><option value="website_change">Website change</option></select></label><label>Stable action key<input value={subjectKey} onChange={(event) => setSubjectKey(event.target.value)} /></label><label className="wide">Owner-visible description<textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} /></label><label>Exact target<input value={target} onChange={(event) => setTarget(event.target.value)} /></label><label>Exact operation<input value={operation} onChange={(event) => setOperation(event.target.value)} /></label>{actionKind === "business_profile_change" ? <><label>Current owner-visible value<input value={currentValue} onChange={(event) => setCurrentValue(event.target.value)} /></label><label>Proposed owner-visible value<input value={proposedValue} onChange={(event) => setProposedValue(event.target.value)} /></label></> : actionKind !== "access_connection" ? <label className="wide">Exact content preview<textarea rows={3} value={scopeDetail} onChange={(event) => setScopeDetail(event.target.value)} /></label> : null}</div><button disabled={busy || subjectKey.trim().length < 3 || description.trim().length < 10 || target.trim().length < 2 || operation.trim().length < 2 || (actionKind === "business_profile_change" && (currentValue.trim().length === 0 || proposedValue.trim().length === 0)) || (!["access_connection", "business_profile_change"].includes(actionKind) && scopeDetail.trim().length === 0)} onClick={() => void run(requestConsent, "An exact seven-day owner decision request was created. No external action occurred.")}>Create exact decision request</button>{data.actionConsents.length > 0 && <div className="momo-record-list">{data.actionConsents.map((item) => <article key={item.id}><div><strong>{titleCase(item.action_kind)}</strong><p>{item.client_description}</p><small>{item.subject_key} · expires {formatDate(item.expires_at)}</small></div><Badge value={item.status} /></article>)}</div>}</details>
  </section>;
}
