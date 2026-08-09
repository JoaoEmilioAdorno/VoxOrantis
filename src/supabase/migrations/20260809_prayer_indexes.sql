-- Vox Orantis
-- Sprint 2 — Commit 15
-- Índices para desempenho das orações e proteção anti-spam


-- =========================================================
-- ANTI-SPAM POR DISPOSITIVO
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_prayers_device_created_at
ON public.prayers (
    device_id,
    created_at DESC
);


-- =========================================================
-- CONSULTA DE ORAÇÕES ATIVAS
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_prayers_expires_created_at
ON public.prayers (
    expires_at,
    created_at
);