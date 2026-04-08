// --- Sentiment Analysis Integration ---
async function getSentiment(text) {
	try {
		const res = await fetch('/api/sentiment', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ text })
		});
		if (!res.ok) return { label: 'UNKNOWN', score: 0 };
		return await res.json();
	} catch (e) {
		return { label: 'ERROR', score: 0 };
	}
}

// --- Example: Render Social Feed with Sentiment ---
async function renderSocialFeed(posts) {
	const feed = document.getElementById('social-feed-list');
	if (!feed) return;
	feed.innerHTML = '';
	for (const post of posts) {
		// Show loading state
		const div = document.createElement('div');
		div.className = 'sf-post';
		div.innerHTML = `<b>${post.handle}</b>: ${post.text}<span class="sentiment-label">Analyzing...</span>`;
		feed.appendChild(div);
		// Fetch sentiment
		const sent = await getSentiment(post.text);
		let color = '#aaa';
		if (sent.label === 'POSITIVE') color = '#2ecc40';
		if (sent.label === 'NEGATIVE') color = '#e74c3c';
		if (sent.label === 'NEUTRAL') color = '#f2c040';
		div.querySelector('.sentiment-label').innerHTML = `&nbsp;<span style="color:${color};font-weight:600;">${sent.label}</span>`;
	}
}

// Example usage (replace MOCK_SOCIAL with your real data):
// document.addEventListener('DOMContentLoaded', async () => {
//   const posts = [
//     { handle: '@User1', text: 'Amazing race today!' },
//     { handle: '@User2', text: 'Disappointed with the result.' }
//   ];
//   await renderSocialFeed(posts);
// });
// --- Pitch Modal Logic ---
document.addEventListener('DOMContentLoaded', () => {
	const pitchBtn = document.getElementById('pitch-btn');
	if (pitchBtn) {
		pitchBtn.onclick = () => {
			document.getElementById('pitch-modal').style.display = 'flex';
		};
	}
});
// --- Tab Navigation Logic ---
function topNav(tab) {
	// Hide all panes
	document.querySelectorAll('.pane').forEach(p => p.classList.remove('on'));
	// Remove 'on' from all tabs
	document.querySelectorAll('.tab').forEach(t => t.classList.remove('on'));
	// Show the selected pane
	const pane = document.getElementById('pane-' + tab);
	if (pane) pane.classList.add('on');
	// Set the selected tab
	const tabEls = document.querySelectorAll('.tab');
	if (tab === 'race') tabEls[0].classList.add('on');
	if (tab === 'fan') tabEls[1].classList.add('on');
	if (tab === 'uci') tabEls[2].classList.add('on');
	if (tab === 'mfr') tabEls[3].classList.add('on');
	if (tab === 'demo') tabEls[4].classList.add('on');
}


// --- Fetch Data from Backend API ---
async function fetchBikes() {
	const res = await fetch('/api/bikes');
	return await res.json();
}

async function fetchGCRiders() {
	const res = await fetch('/api/gc');
	return await res.json();
}

async function fetchEquipment() {
	const res = await fetch('/api/equipment');
	return await res.json();
}

// Example: Populate GC Standings on load
document.addEventListener('DOMContentLoaded', async () => {
	// GC Standings
	const gcList = document.getElementById('gc-list');
	if (gcList) {
		const gcRiders = await fetchGCRiders();
		gcList.innerHTML = gcRiders.map(r => `
			<div class="gc-item">
				<div class="gc-pos">${r.pos}</div>
				<div class="gc-name">${r.name}</div>
				<div class="gc-gap">${r.gap}</div>
			</div>
		`).join('');
	}
	// You can add similar logic for bikes and equipment as needed.
});