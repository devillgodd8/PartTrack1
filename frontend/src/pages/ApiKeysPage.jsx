import { useState, useEffect } from 'react';
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
  ClockIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';

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

  const codeSnippets = {
    html: `<!-- WordPress / Custom HTML Block Embed -->
<!-- Paste directly into a "Custom HTML" block in WordPress Gutenberg, Elementor, Divi, or any website -->
<div id="part-track-widget" style="max-width: 480px; margin: 20px 0; padding: 20px; border: 1px solid #334155; border-radius: 12px; background: #0f172a; color: #f8fafc; font-family: sans-serif;">
  <h4 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">Track Shipment</h4>
  <div style="display: flex; gap: 8px;">
    <input type="text" id="pt-track-input" placeholder="Enter 12-digit Tracking #" style="flex: 1; padding: 10px 14px; border: 1px solid #334155; border-radius: 8px; background: #1e293b; color: #ffffff; font-size: 14px; outline: none;" />
    <button id="pt-track-btn" style="padding: 10px 18px; background: #0e87ea; color: #ffffff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">Track</button>
  </div>
  <div id="pt-track-result" style="margin-top: 14px; font-size: 14px;"></div>
</div>

<script>
  (function() {
    var btn = document.getElementById('pt-track-btn');
    var input = document.getElementById('pt-track-input');
    var resDiv = document.getElementById('pt-track-result');

    btn.addEventListener('click', async function() {
      var num = input.value.trim();
      if (!num) {
        alert('Please enter a tracking number');
        return;
      }
      resDiv.innerHTML = '<span style="color: #94a3b8;">Searching shipment...</span>';

      try {
        var res = await fetch('http://localhost:5000/api/v1/track/' + encodeURIComponent(num), {
          headers: { 'X-API-Key': '${activeKeySample}' }
        });
        var json = await res.json();

        if (!res.ok || !json.success) {
          resDiv.innerHTML = '<div style="padding: 10px; background: rgba(239, 68, 68, 0.1); border-radius: 6px; color: #f87171;">' + (json.error || 'Tracking record not found') + '</div>';
          return;
        }

        var d = json.data;
        resDiv.innerHTML = '<div style="padding: 14px; background: #1e293b; border-radius: 8px; border-left: 4px solid #38bdf8;">' +
          '<div style="font-weight: 600; font-size: 15px; color: #38bdf8; margin-bottom: 6px;">Status: ' + d.current_status + '</div>' +
          '<div style="color: #cbd5e1; font-size: 13px; line-height: 1.5;">' +
            '<div><strong>Part:</strong> ' + d.part_type + '</div>' +
            '<div><strong>Vehicle:</strong> ' + d.vehicle.year + ' ' + d.vehicle.make + ' ' + d.vehicle.model + '</div>' +
            '<div><strong>Route:</strong> ' + d.shipment.origin + ' &rarr; ' + d.shipment.destination + '</div>' +
            (d.estimated_delivery_date ? '<div><strong>Est. Delivery:</strong> ' + d.estimated_delivery_date + '</div>' : '') +
          '</div>' +
        '</div>';
      } catch (err) {
        resDiv.innerHTML = '<div style="padding: 10px; background: rgba(239, 68, 68, 0.1); border-radius: 6px; color: #f87171;">Unable to connect to tracking server.</div>';
      }
    });
  })();
</script>`,
    javascript: `// JavaScript (Browser Fetch)
async function trackShipment(trackingNumber) {
  const res = await fetch(\`http://localhost:5000/api/v1/track/\${trackingNumber}\`, {
    headers: {
      'X-API-Key': '${activeKeySample}'
    }
  });
  const data = await res.json();
  if (data.success) {
    console.log('Status:', data.data.current_status);
    console.log('Timeline:', data.data.history);
  } else {
    alert(data.error);
  }
}`,
    curl: `# cURL (Terminal / Command Line)
curl -X GET "http://localhost:5000/api/v1/track/573978943296" \\
  -H "X-API-Key: ${activeKeySample}"`,
    node: `// Node.js (Axios)
const axios = require('axios');

async function track(number) {
  const { data } = await axios.get(\`http://localhost:5000/api/v1/track/\${number}\`, {
    headers: { 'X-API-Key': '${activeKeySample}' }
  });
  return data;
}`,
    python: `# Python (requests)
import requests

response = requests.get(
    "http://localhost:5000/api/v1/track/573978943296",
    headers={"X-API-Key": "${activeKeySample}"}
)
print(response.json())`,
  };

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
            Generate scoped API tokens to embed live shipment lookup directly into WordPress or custom web portals.
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

      {/* Integration Guide & Code Samples */}
      <div className="card p-5 sm:p-6 bg-surface-900 border border-surface-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <CodeBracketIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-surface-100 uppercase tracking-wider">
                How to Integrate on Your Website
              </h3>
              <p className="text-xs text-surface-400">Embed snippets or API queries into your frontend application</p>
            </div>
          </div>
          <button
            onClick={() => copyToClipboard(codeSnippets[activeTab], true)}
            className="btn-secondary btn-sm self-start sm:self-auto inline-flex items-center gap-1.5"
          >
            {copiedSnippet ? (
              <>
                <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <ClipboardDocumentIcon className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-surface-400 leading-relaxed">
          Send an HTTP GET request to <code className="text-brand-400 font-mono bg-surface-950 px-1.5 py-0.5 rounded border border-surface-800">http://localhost:5000/api/v1/track/:trackingNumber</code> with your API key in the <code className="text-amber-400 font-mono bg-surface-950 px-1.5 py-0.5 rounded border border-surface-800">X-API-Key</code> header.
        </p>

        {/* Code Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'html', label: 'WordPress / HTML Embed' },
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
                  placeholder="e.g. WordPress Main Store, Customer Portal"
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
