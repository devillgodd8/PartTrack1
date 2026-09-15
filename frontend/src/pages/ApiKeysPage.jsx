import { useState, useEffect, useMemo } from 'react';
import { listApiKeys, createApiKey, revokeApiKey } from '../api/apiKeys';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import {
  KeyIcon,
  PlusIcon,
  TrashIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  CodeBracketIcon,
  XMarkIcon,
  PaintBrushIcon,
  SunIcon,
  MoonIcon,
  CheckIcon,
  ClockIcon,
  ArchiveBoxIcon,
  TruckIcon,
  PaperAirplaneIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';

const ACCENT_PRESETS = [
  { name: 'Corporate Blue', color: '#2563eb' },
  { name: 'Emerald Green', color: '#059669' },
  { name: 'Royal Violet', color: '#7c3aed' },
  { name: 'Amber Orange', color: '#d97706' },
  { name: 'Crimson Red', color: '#e11d48' },
  { name: 'Sleek Slate', color: '#334155' },
];

const PREVIEW_STAGES = [
  { label: 'Processing', step: 0, status: 'Pending', note: 'Order registered & packaged' },
  { label: 'Pickup', step: 1, status: 'Picked Up', note: 'Collected from Detroit facility' },
  { label: 'In Transit', step: 2, status: 'In Transit', note: 'Departed sorting terminal' },
  { label: 'Out for Delivery', step: 3, status: 'Out for Delivery', note: 'Dispatched with local courier' },
  { label: 'Delivered', step: 4, status: 'Delivered', note: 'Signed & received at destination' },
];

export default function ApiKeysPage() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [revealedKey, setRevealedKey] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [activeTab, setActiveTab] = useState('html');

  // Widget customizer state for external website matching
  const [widgetTheme, setWidgetTheme] = useState('light'); // 'light' | 'dark'
  const [widgetAccent, setWidgetAccent] = useState('#2563eb');
  const [widgetRadius, setWidgetRadius] = useState('12px');
  const [previewStage, setPreviewStage] = useState(2); // In Transit

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    try {
      setLoading(true);
      const data = await listApiKeys();
      setKeys(data.keys || []);
    } catch {
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (e) => {
    e.preventDefault();
    if (!keyName.trim()) {
      toast.error('Please enter a name for the API key');
      return;
    }

    setCreating(true);
    try {
      const data = await createApiKey(keyName.trim());
      setRevealedKey(data.apiKey);
      setCreateModalOpen(false);
      setKeyName('');
      loadKeys();
      toast.success('API key generated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate key');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id, name) => {
    if (!window.confirm(`Are you sure you want to revoke the key "${name}"? External websites using this key will no longer be able to track shipments.`)) {
      return;
    }

    try {
      await revokeApiKey(id);
      toast.success('API key revoked');
      loadKeys();
    } catch {
      toast.error('Failed to revoke key');
    }
  };

  const copyToClipboard = (text, isSnippet = false) => {
    navigator.clipboard.writeText(text);
    if (isSnippet) {
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
    toast.success('Copied to clipboard!');
  };

  const activeKeySample = revealedKey || (keys.length > 0 ? keys[0].key_prefix.replace('...', 'YOUR_FULL_KEY') : 'pt_live_YOUR_API_KEY');

  const apiBaseUrl = typeof window !== 'undefined' && window.location.origin.includes('reviorcm.com')
    ? window.location.origin
    : (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'https://app.reviorcm.com');

  // Dynamically generated code snippets based on the user's customized theme & brand colors
  const codeSnippets = useMemo(() => {
    const isLight = widgetTheme === 'light';
    const bgColor = isLight ? '#ffffff' : '#0f172a';
    const textColor = isLight ? '#0f172a' : '#f8fafc';
    const subtextColor = isLight ? '#64748b' : '#94a3b8';
    const borderColor = isLight ? '#e2e8f0' : '#334155';
    const cardBg = isLight ? '#f8fafc' : '#1e293b';
    const trackBg = isLight ? '#e2e8f0' : '#334155';
    const inputBg = isLight ? '#ffffff' : '#020617';

    return {
      html: `<!-- PartTrack 5-Point Shipment Tracking Widget -->
<!-- Paste directly into WordPress Custom HTML, Shopify Liquid, Webflow, or any website -->
<style>
  :root {
    --pt-accent: ${widgetAccent};
    --pt-bg: ${bgColor};
    --pt-card-bg: ${cardBg};
    --pt-text: ${textColor};
    --pt-muted: ${subtextColor};
    --pt-border: ${borderColor};
    --pt-track: ${trackBg};
    --pt-radius: ${widgetRadius};
  }

  .pt-widget {
    max-width: 680px;
    margin: 24px auto;
    padding: 24px;
    background: var(--pt-bg);
    color: var(--pt-text);
    border: 1px solid var(--pt-border);
    border-radius: var(--pt-radius);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
    box-sizing: border-box;
  }
  .pt-widget * { box-sizing: border-box; }
  .pt-widget h4 { margin: 0 0 6px 0; font-size: 18px; font-weight: 700; color: var(--pt-text); }
  .pt-widget p.pt-desc { margin: 0 0 16px 0; font-size: 13px; color: var(--pt-muted); }
  
  .pt-form { display: flex; gap: 8px; margin-bottom: 20px; }
  .pt-input {
    flex: 1;
    padding: 12px 16px;
    border: 1px solid var(--pt-border);
    border-radius: calc(var(--pt-radius) - 4px);
    background: ${inputBg};
    color: var(--pt-text);
    font-size: 14px;
    font-family: monospace;
    letter-spacing: 0.05em;
    outline: none;
  }
  .pt-input:focus { border-color: var(--pt-accent); }
  .pt-btn {
    padding: 12px 22px;
    background: var(--pt-accent);
    color: #ffffff;
    border: none;
    border-radius: calc(var(--pt-radius) - 4px);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
  }
  .pt-btn:hover { opacity: 0.9; }

  /* 5-Point Stepper */
  .pt-stepper { position: relative; margin: 24px 0 16px 0; padding: 0 8px; }
  .pt-track-bg { position: absolute; left: 24px; right: 24px; top: 16px; height: 4px; background: var(--pt-track); border-radius: 4px; }
  .pt-track-fill { position: absolute; left: 24px; top: 16px; height: 4px; background: var(--pt-accent); border-radius: 4px; transition: width 0.5s ease; }
  .pt-steps { position: relative; display: flex; justify-content: space-between; align-items: flex-start; z-index: 2; }
  .pt-step { display: flex; flex-direction: column; align-items: center; text-align: center; width: 18%; }
  .pt-node {
    width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
    background: var(--pt-card-bg); border: 2px solid var(--pt-border); color: var(--pt-muted); font-size: 12px; font-weight: bold;
    margin-bottom: 8px; transition: all 0.3s;
  }
  .pt-node.completed { background: #10b981; border-color: #10b981; color: #ffffff; }
  .pt-node.active { background: var(--pt-accent); border-color: var(--pt-accent); color: #ffffff; box-shadow: 0 0 0 4px rgba(37,99,235,0.2); }
  .pt-label { font-size: 11px; font-weight: 600; color: var(--pt-muted); line-height: 1.2; }
  .pt-label.active, .pt-label.completed { color: var(--pt-text); }
  .pt-step-date { font-size: 10px; color: var(--pt-muted); margin-top: 3px; font-family: monospace; }

  /* Details Grid */
  .pt-details { margin-top: 16px; padding: 14px; background: var(--pt-card-bg); border: 1px solid var(--pt-border); border-radius: calc(var(--pt-radius) - 4px); font-size: 13px; }
  .pt-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .pt-item-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--pt-muted); font-weight: 600; }
  .pt-item-val { font-size: 13px; font-weight: 500; color: var(--pt-text); margin-top: 2px; }
</style>

<div class="pt-widget" id="pt-widget">
  <h4>Track Consignment</h4>
  <p class="pt-desc">Enter your 12-digit tracking number to view milestone progress.</p>
  
  <div class="pt-form">
    <input type="text" id="pt-input" class="pt-input" placeholder="e.g. 241190101721" />
    <button id="pt-btn" class="pt-btn">Track Order</button>
  </div>
  
  <div id="pt-result"></div>
</div>

<script>
  (function() {
    var API_KEY = '${activeKeySample}';
    var API_BASE = '${apiBaseUrl}/api/v1/track/';
    var MILESTONES = ['Processing', 'Pickup', 'In Transit', 'Out for Delivery', 'Delivered'];

    function getStepIndex(status) {
      if (!status) return 0;
      var s = status.toLowerCase();
      if (s === 'delivered') return 4;
      if (s === 'out for delivery') return 3;
      if (s === 'in transit' || s === 'delayed' || s === 'on hold') return 2;
      if (s === 'picked up' || s === 'pickup') return 1;
      return 0;
    }

    var btn = document.getElementById('pt-btn');
    var input = document.getElementById('pt-input');
    var resDiv = document.getElementById('pt-result');

    btn.addEventListener('click', async function() {
      var num = input.value.trim();
      if (!num) return alert('Please enter your tracking number.');
      resDiv.innerHTML = '<p style="color:var(--pt-muted);font-size:13px;">Searching ledger...</p>';

      try {
        var res = await fetch(API_BASE + encodeURIComponent(num), {
          headers: { 'X-API-Key': API_KEY }
        });
        var json = await res.json();
        if (!res.ok || !json.success) {
          resDiv.innerHTML = '<div style="padding:12px;color:#ef4444;background:rgba(239,68,68,0.1);border-radius:8px;">' + (json.error || 'Tracking record not found') + '</div>';
          return;
        }

        var d = json.data;
        var activeStep = getStepIndex(d.current_status);
        var fillPct = (activeStep / 4) * 100;

        // Build 5 points HTML
        var stepsHtml = '';
        for (var i = 0; i < MILESTONES.length; i++) {
          var isCompleted = i < activeStep;
          var isActive = i === activeStep;
          var cls = isCompleted ? 'completed' : (isActive ? 'active' : '');
          var checkIcon = isCompleted || (isActive && activeStep === 4) ? '&#10003;' : (i + 1);
          stepsHtml += '<div class="pt-step">' +
            '<div class="pt-node ' + cls + '">' + checkIcon + '</div>' +
            '<div class="pt-label ' + cls + '">' + MILESTONES[i] + '</div>' +
          '</div>';
        }

        resDiv.innerHTML =
          '<div style="margin-top:16px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
              '<div>' +
                '<span style="font-size:11px;color:var(--pt-muted);text-transform:uppercase;font-weight:600;">Status</span>' +
                '<div style="font-size:16px;font-weight:700;color:var(--pt-accent);">' + d.current_status + '</div>' +
              '</div>' +
              (d.estimated_delivery_date ? '<div style="text-align:right;"><span style="font-size:11px;color:var(--pt-muted);text-transform:uppercase;font-weight:600;">Est. Delivery</span><div style="font-size:13px;font-weight:600;">' + new Date(d.estimated_delivery_date).toLocaleDateString() + '</div></div>' : '') +
            '</div>' +

            '<div class="pt-stepper">' +
              '<div class="pt-track-bg"></div>' +
              '<div class="pt-track-fill" style="width: calc(' + fillPct + '% * 0.9);"></div>' +
              '<div class="pt-steps">' + stepsHtml + '</div>' +
            '</div>' +

            '<div class="pt-details">' +
              '<div class="pt-grid">' +
                '<div><div class="pt-item-label">Part Item</div><div class="pt-item-val">' + (d.part_type || 'Automotive Component') + '</div></div>' +
                '<div><div class="pt-item-label">Vehicle Fitment</div><div class="pt-item-val">' + d.vehicle.year + ' ' + d.vehicle.make + ' ' + d.vehicle.model + '</div></div>' +
                '<div><div class="pt-item-label">Origin</div><div class="pt-item-val">' + (d.shipment.origin || 'Origin Terminal') + '</div></div>' +
                '<div><div class="pt-item-label">Destination</div><div class="pt-item-val">' + (d.shipment.destination || 'Delivery Address') + '</div></div>' +
              '</div>' +
            '</div>' +
          '</div>';
      } catch (err) {
        resDiv.innerHTML = '<div style="padding:12px;color:#ef4444;background:rgba(239,68,68,0.1);border-radius:8px;">Network connection error.</div>';
      }
    });
  })();
</script>`,

      react: `// React / Next.js Component with 5-Point Tracking Status Bar
// Compatible with Tailwind CSS and CSS Custom Properties
import React, { useState } from 'react';

const MILESTONES = ['Processing', 'Pickup', 'In Transit', 'Out for Delivery', 'Delivered'];

function getStepIndex(status) {
  if (!status) return 0;
  const s = status.toLowerCase();
  if (s === 'delivered') return 4;
  if (s === 'out for delivery') return 3;
  if (s === 'in transit' || s === 'delayed' || s === 'on hold') return 2;
  if (s === 'picked up' || s === 'pickup') return 1;
  return 0;
}

export default function PartTrackWidget({
  apiKey = '${activeKeySample}',
  accentColor = '${widgetAccent}',
  theme = '${widgetTheme}', // 'light' or 'dark'
}) {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!trackingNumber.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(\`${apiBaseUrl}/api/v1/track/\${encodeURIComponent(trackingNumber.trim())}\`, {
        headers: { 'X-API-Key': apiKey }
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Tracking number not found');
      }
      setData(json.data);
    } catch (err) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const isDark = theme === 'dark';
  const activeStep = data ? getStepIndex(data.current_status) : 0;
  const progressPercent = (activeStep / 4) * 100;

  return (
    <div style={{
      maxWidth: '680px',
      margin: '20px auto',
      padding: '24px',
      borderRadius: '${widgetRadius}',
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      color: isDark ? '#f8fafc' : '#0f172a',
      border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
    }}>
      <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700 }}>Track Shipment</h3>
      <form onSubmit={handleTrack} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          type="text"
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
          placeholder="Enter 12-digit tracking number"
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '8px',
            border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
            backgroundColor: isDark ? '#020617' : '#ffffff',
            color: isDark ? '#ffffff' : '#0f172a'
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: accentColor,
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {loading ? 'Searching...' : 'Track'}
        </button>
      </form>

      {error && <div style={{ color: '#ef4444', fontSize: '13px' }}>{error}</div>}

      {data && (
        <div>
          {/* 5-Point Stepper */}
          <div style={{ position: 'relative', margin: '24px 0 20px 0' }}>
            <div style={{ position: 'absolute', left: '20px', right: '20px', top: '15px', height: '4px', backgroundColor: isDark ? '#334155' : '#e2e8f0' }} />
            <div style={{ position: 'absolute', left: '20px', top: '15px', height: '4px', width: \`calc(\${progressPercent}% * 0.9)\`, backgroundColor: accentColor, transition: 'width 0.4s ease' }} />
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between' }}>
              {MILESTONES.map((label, idx) => {
                const isCompleted = idx < activeStep;
                const isActive = idx === activeStep;
                return (
                  <div key={label} style={{ textAlign: 'center', width: '20%' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      margin: '0 auto 6px auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: isCompleted || isActive ? '#ffffff' : '#94a3b8',
                      backgroundColor: isCompleted ? '#10b981' : (isActive ? accentColor : (isDark ? '#1e293b' : '#f1f5f9')),
                      border: isCompleted ? '2px solid #10b981' : (isActive ? \`2px solid \${accentColor}\` : '2px solid #cbd5e1')
                    }}>
                      {isCompleted || (isActive && activeStep === 4) ? '✓' : idx + 1}
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: isActive ? 700 : 500 }}>{label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}`,

      javascript: `// Pure JavaScript Fetch Implementation
async function fetchTracking(trackingNumber) {
  const res = await fetch(\`${apiBaseUrl}/api/v1/track/\${encodeURIComponent(trackingNumber)}\`, {
    headers: {
      'X-API-Key': '${activeKeySample}'
    }
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Tracking lookup failed');
  }

  // Response contains 5-point milestone data:
  console.log('Current Status:', json.data.current_status);
  console.log('Origin:', json.data.shipment.origin);
  console.log('Destination:', json.data.shipment.destination);
  console.log('Milestone History:', json.data.history);
  return json.data;
}`,

      curl: `# cURL Request
curl -X GET "${apiBaseUrl}/api/v1/track/241190101721" \\
  -H "X-API-Key: ${activeKeySample}"`,

      node: `// Node.js (Axios)
const axios = require('axios');

async function getTracking(trackingNumber) {
  const { data } = await axios.get(\`${apiBaseUrl}/api/v1/track/\${trackingNumber}\`, {
    headers: {
      'X-API-Key': '${activeKeySample}'
    }
  });
  return data;
}`,

      python: `# Python (requests)
import requests

response = requests.get(
    "${apiBaseUrl}/api/v1/track/241190101721",
    headers={"X-API-Key": "${activeKeySample}"}
)
tracking_data = response.json()
print(tracking_data)`,
    };
  }, [widgetTheme, widgetAccent, widgetRadius, activeKeySample, apiBaseUrl]);

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1 border-b border-surface-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-surface-50 flex items-center gap-2.5">
            <KeyIcon className="w-6 h-6 text-brand-400" />
            API Keys & External Integration
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-surface-400">
            Generate scoped API tokens and embed white-label shipment tracking widgets matching your client's brand.
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="btn-primary btn-sm self-start sm:self-auto inline-flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Generate API Key</span>
        </button>
      </div>

      {/* Security Scope Banner */}
      <div className="card p-4 bg-surface-900 border border-brand-500/20 flex items-start gap-3">
        <ShieldCheckIcon className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
        <div className="text-xs text-surface-300 leading-relaxed">
          <strong className="text-brand-300 font-semibold">Strict Read-Only Permission:</strong> API keys generated here are scoped strictly to shipment lookup via <code className="px-1.5 py-0.5 rounded bg-surface-950 text-brand-400 font-mono border border-surface-800">/api/v1/track</code>. Keys cannot modify database records, view users, or delete tracking history.
        </div>
      </div>

      {/* Keys Section: Mobile Cards & Desktop Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-surface-200">Active API Keys</h2>
          <span className="text-xs text-surface-400">{keys.length} key{keys.length !== 1 ? 's' : ''} active</span>
        </div>

        {loading ? (
          <LoadingSpinner text="Retrieving registered API keys..." />
        ) : keys.length === 0 ? (
          <EmptyState
            icon={KeyIcon}
            title="No API keys generated yet"
            description="Generate a secure API key to embed shipment search widgets into WordPress, Shopify, or your custom website."
            actionLabel="Generate First API Key"
            onAction={() => setCreateModalOpen(true)}
          />
        ) : (
          <>
            {/* Mobile View: Cards */}
            <div className="sm:hidden space-y-3">
              {keys.map((k) => (
                <div key={k.id} className="card p-4 bg-surface-900 border border-surface-800 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-surface-100 text-sm">{k.name}</p>
                      <p className="font-mono text-xs text-brand-400 mt-1 bg-surface-950 px-2 py-0.5 rounded border border-surface-800 inline-block">
                        {k.key_prefix}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {k.permissions}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-surface-400 pt-2 border-t border-surface-800">
                    <span className="text-[11px]">
                      Created: {k.created_at ? format(new Date(k.created_at), 'MMM d, yyyy') : '—'}
                    </span>
                    <button
                      onClick={() => handleRevoke(k.id, k.name)}
                      className="btn-ghost btn-sm text-rose-400 hover:bg-rose-500/10 p-1.5"
                      title="Revoke key"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden sm:block table-container">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    <th className="table-header">Key Name</th>
                    <th className="table-header">Prefix Identifier</th>
                    <th className="table-header">Scope</th>
                    <th className="table-header">Created</th>
                    <th className="table-header">Last Used</th>
                    <th className="table-header text-right">Revoke</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-800">
                  {keys.map((k) => (
                    <tr key={k.id} className="table-row">
                      <td className="table-cell font-medium text-surface-100">{k.name}</td>
                      <td className="table-cell">
                        <code className="px-2 py-0.5 rounded bg-surface-950 font-mono text-xs text-brand-400 border border-surface-800">
                          {k.key_prefix}
                        </code>
                      </td>
                      <td className="table-cell">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {k.permissions}
                        </span>
                      </td>
                      <td className="table-cell text-surface-400 text-xs font-mono">
                        {k.created_at ? format(new Date(k.created_at), 'MMM d, yyyy') : '—'}
                      </td>
                      <td className="table-cell text-surface-400 text-xs font-mono">
                        {k.last_used_at ? formatDistanceToNow(new Date(k.last_used_at), { addSuffix: true }) : 'Never used'}
                      </td>
                      <td className="table-cell text-right">
                        <button
                          onClick={() => handleRevoke(k.id, k.name)}
                          className="btn-ghost btn-sm text-surface-400 hover:text-rose-400 hover:bg-rose-500/10"
                          title="Revoke Key"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Widget Customizer & Interactive Live Preview */}
      <div className="card p-5 sm:p-7 bg-surface-900 border border-surface-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                <PaintBrushIcon className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-surface-100">
                External Website Theme Customizer
              </h2>
            </div>
            <p className="text-xs text-surface-400 mt-1">
              Adjust the theme and brand palette to match your external website's UI/UX. The code snippets below update automatically.
            </p>
          </div>
        </div>

        {/* Customizer Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 p-4 rounded-xl bg-surface-950/70 border border-surface-800/80">
          {/* Theme Mode Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-surface-300 uppercase tracking-wider block">
              Website Theme
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setWidgetTheme('light')}
                className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border ${
                  widgetTheme === 'light'
                    ? 'bg-brand-500 text-white border-brand-400 shadow-sm'
                    : 'bg-surface-900 text-surface-300 border-surface-700 hover:bg-surface-800'
                }`}
              >
                <SunIcon className="w-3.5 h-3.5" />
                <span>Light Theme</span>
              </button>
              <button
                type="button"
                onClick={() => setWidgetTheme('dark')}
                className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border ${
                  widgetTheme === 'dark'
                    ? 'bg-brand-500 text-white border-brand-400 shadow-sm'
                    : 'bg-surface-900 text-surface-300 border-surface-700 hover:bg-surface-800'
                }`}
              >
                <MoonIcon className="w-3.5 h-3.5" />
                <span>Dark Theme</span>
              </button>
            </div>
          </div>

          {/* Accent Color Picker */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-surface-300 uppercase tracking-wider block">
              Brand Accent Color
            </label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {ACCENT_PRESETS.map((preset) => (
                  <button
                    key={preset.color}
                    type="button"
                    onClick={() => setWidgetAccent(preset.color)}
                    style={{ backgroundColor: preset.color }}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${
                      widgetAccent === preset.color ? 'ring-2 ring-white ring-offset-2 ring-offset-surface-950' : ''
                    }`}
                    title={preset.name}
                  >
                    {widgetAccent === preset.color && (
                      <CheckIcon className="w-3 h-3 text-white stroke-[3]" />
                    )}
                  </button>
                ))}
              </div>
              <input
                type="color"
                value={widgetAccent}
                onChange={(e) => setWidgetAccent(e.target.value)}
                className="w-7 h-7 rounded border border-surface-700 cursor-pointer bg-transparent"
                title="Custom Hex Color"
              />
            </div>
          </div>

          {/* Corner Radius */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-surface-300 uppercase tracking-wider block">
              Border Radius
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: 'Sharp', val: '4px' },
                { label: 'Rounded', val: '12px' },
                { label: 'Pill', val: '20px' },
              ].map((r) => (
                <button
                  key={r.val}
                  type="button"
                  onClick={() => setWidgetRadius(r.val)}
                  className={`py-2 px-2 text-center rounded-lg text-xs font-medium border transition-colors ${
                    widgetRadius === r.val
                      ? 'bg-brand-500 text-white border-brand-400 shadow-sm'
                      : 'bg-surface-900 text-surface-300 border-surface-700 hover:bg-surface-800'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Interactive Preview Box */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-surface-300 uppercase tracking-wider">
              Live Interactive Preview ({widgetTheme.toUpperCase()} MODE)
            </span>
            <div className="flex items-center gap-1 text-[11px] text-surface-400">
              <span>Test Stage:</span>
              <div className="inline-flex rounded-lg bg-surface-950 p-0.5 border border-surface-800">
                {PREVIEW_STAGES.map((s) => (
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => setPreviewStage(s.step)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                      previewStage === s.step
                        ? 'bg-brand-500 text-white'
                        : 'text-surface-400 hover:text-surface-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mock Container matching the customized theme */}
          <div
            className="p-6 transition-all duration-300 border shadow-md"
            style={{
              backgroundColor: widgetTheme === 'light' ? '#ffffff' : '#0f172a',
              color: widgetTheme === 'light' ? '#0f172a' : '#f8fafc',
              borderColor: widgetTheme === 'light' ? '#e2e8f0' : '#334155',
              borderRadius: widgetRadius,
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b"
              style={{ borderColor: widgetTheme === 'light' ? '#e2e8f0' : '#1e293b' }}
            >
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">Consignment Status</span>
                <h4 className="text-lg font-bold mt-0.5" style={{ color: widgetAccent }}>
                  {PREVIEW_STAGES[previewStage].status}
                </h4>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">Est. Delivery</span>
                <p className="text-xs font-mono font-semibold">Sep 18, 2026</p>
              </div>
            </div>

            {/* 5-Point Stepper Bar in Live Preview */}
            <div className="relative mb-6 px-2">
              {/* Base Track */}
              <div
                className="absolute left-6 right-6 top-4 h-1 rounded-full"
                style={{ backgroundColor: widgetTheme === 'light' ? '#e2e8f0' : '#334155' }}
              />
              {/* Active Progress Fill */}
              <div
                className="absolute left-6 top-4 h-1 rounded-full transition-all duration-500"
                style={{
                  width: `calc(${(previewStage / 4) * 100}% * 0.9)`,
                  backgroundColor: widgetAccent,
                }}
              />

              {/* 5 Points */}
              <div className="relative flex justify-between items-start">
                {[
                  { label: 'Processing', icon: ClockIcon },
                  { label: 'Pickup', icon: ArchiveBoxIcon },
                  { label: 'In Transit', icon: TruckIcon },
                  { label: 'Out for Delivery', icon: PaperAirplaneIcon },
                  { label: 'Delivered', icon: MapPinIcon },
                ].map((pt, idx) => {
                  const isPast = idx < previewStage;
                  const isCurrent = idx === previewStage;
                  const isDelivered = previewStage === 4;
                  const Icon = pt.icon;

                  let nodeBg = widgetTheme === 'light' ? '#f8fafc' : '#1e293b';
                  let nodeBorder = widgetTheme === 'light' ? '#cbd5e1' : '#475569';
                  let nodeColor = widgetTheme === 'light' ? '#94a3b8' : '#64748b';

                  if (isPast || (isCurrent && isDelivered)) {
                    nodeBg = '#10b981';
                    nodeBorder = '#10b981';
                    nodeColor = '#ffffff';
                  } else if (isCurrent) {
                    nodeBg = widgetAccent;
                    nodeBorder = widgetAccent;
                    nodeColor = '#ffffff';
                  }

                  return (
                    <div key={pt.label} className="flex flex-col items-center text-center w-[18%]">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 relative z-10 mb-2 shadow-sm"
                        style={{
                          backgroundColor: nodeBg,
                          borderColor: nodeBorder,
                          borderWidth: '2px',
                          color: nodeColor,
                          boxShadow: isCurrent ? `0 0 12px ${widgetAccent}55` : undefined,
                        }}
                      >
                        {isPast || (isCurrent && isDelivered) ? (
                          <CheckIcon className="w-4 h-4 stroke-[2.5]" />
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                      </div>
                      <span className="text-[11px] font-semibold leading-tight">{pt.label}</span>
                      <span className="text-[10px] opacity-60 mt-0.5">
                        {idx <= previewStage ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Spec Details Preview */}
            <div
              className="p-3.5 rounded-lg grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs"
              style={{
                backgroundColor: widgetTheme === 'light' ? '#f1f5f9' : '#1e293b',
                border: widgetTheme === 'light' ? '1px solid #e2e8f0' : '1px solid #334155',
              }}
            >
              <div>
                <span className="text-[9px] uppercase font-bold tracking-wider opacity-60">Part</span>
                <p className="font-semibold mt-0.5">Engine (V8 5.0L)</p>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold tracking-wider opacity-60">Vehicle</span>
                <p className="font-semibold mt-0.5">2022 Ford F-150</p>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold tracking-wider opacity-60">Route</span>
                <p className="font-semibold mt-0.5">Detroit &rarr; Dallas</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Integration Guide & Code Samples */}
      <div className="card p-5 sm:p-6 bg-surface-900 border border-surface-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <CodeBracketIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-surface-100 uppercase tracking-wider">
                Embed Code Snippets (Themed for Your Site)
              </h3>
              <p className="text-xs text-surface-400">
                Copy and paste the code below into WordPress, Shopify, Next.js, or custom backend
              </p>
            </div>
          </div>
          <button
            onClick={() => copyToClipboard(codeSnippets[activeTab], true)}
            className="btn-secondary btn-sm self-start sm:self-auto inline-flex items-center gap-1.5"
          >
            {copiedSnippet ? (
              <>
                <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied Code</span>
              </>
            ) : (
              <>
                <ClipboardDocumentIcon className="w-3.5 h-3.5" />
                <span>Copy Snippet</span>
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-surface-400 leading-relaxed">
          The code below includes the complete <strong className="text-surface-200">5-point status bar</strong> configured with your chosen theme (<strong className="capitalize text-surface-200">{widgetTheme}</strong>) and accent color (<code className="text-brand-400 font-mono">{widgetAccent}</code>).
        </p>

        {/* Code Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'html', label: 'WordPress / HTML Embed (Universal)' },
            { id: 'react', label: 'React / Next.js Component' },
            { id: 'javascript', label: 'JavaScript (Fetch)' },
            { id: 'curl', label: 'cURL' },
            { id: 'node', label: 'Node.js' },
            { id: 'python', label: 'Python' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-surface-400 hover:text-surface-200 bg-surface-800/80 hover:bg-surface-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Code Box */}
        <div className="relative rounded-xl overflow-hidden bg-surface-950 border border-surface-800 p-4 font-mono text-xs text-surface-200">
          <pre className="overflow-x-auto whitespace-pre leading-relaxed font-mono">
            {codeSnippets[activeTab]}
          </pre>
        </div>
      </div>

      {/* Modal 1: Create Key */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="card max-w-md w-full p-6 bg-surface-900 border border-surface-800 shadow-2xl relative">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="absolute top-4 right-4 text-surface-400 hover:text-surface-200"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-surface-50 mb-1">Generate Scoped API Key</h3>
            <p className="text-xs text-surface-400 mb-5">
              Give this key a label to identify the store, client, or site using it.
            </p>

            <form onSubmit={handleCreateKey} className="space-y-4">
              <div>
                <label className="input-label">Key Name / Identifier</label>
                <input
                  type="text"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g. WordPress Main Store, Client Webflow Site"
                  className="input"
                  autoFocus
                  required
                />
              </div>

              <div className="p-3.5 rounded-lg bg-surface-950 border border-surface-800 text-xs text-surface-400 space-y-1">
                <div className="flex items-center gap-1.5 font-medium text-surface-300">
                  <ShieldCheckIcon className="w-4 h-4 text-brand-400" />
                  Key Permissions
                </div>
                <p>Read-only access to tracking queries (<code className="text-brand-400 font-mono">/api/v1/track</code>).</p>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary btn-sm"
                >
                  {creating ? 'Generating...' : 'Create Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Revealed Key Modal */}
      {revealedKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="card max-w-lg w-full p-6 bg-surface-900 border border-brand-500/40 shadow-2xl relative">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
              <CheckCircleIcon className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-surface-50 mb-1">Your API Key is Ready!</h3>
            <p className="text-xs text-surface-400 mb-4">
              Please copy your key now and store it securely. <strong>For security reasons, it will never be displayed in full again.</strong>
            </p>

            <div className="p-3.5 rounded-lg bg-surface-950 border border-surface-800 flex items-center justify-between gap-3 font-mono text-sm text-brand-400 break-all mb-4">
              <span className="font-semibold">{revealedKey}</span>
              <button
                onClick={() => copyToClipboard(revealedKey)}
                className="shrink-0 p-2 rounded-md hover:bg-surface-800 text-surface-300 hover:text-white transition-colors"
                title="Copy to clipboard"
              >
                {copiedKey ? (
                  <ClipboardDocumentCheckIcon className="w-5 h-5 text-emerald-400" />
                ) : (
                  <ClipboardDocumentIcon className="w-5 h-5" />
                )}
              </button>
            </div>

            <button
              onClick={() => setRevealedKey(null)}
              className="btn-primary w-full"
            >
              I Have Saved My API Key
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
